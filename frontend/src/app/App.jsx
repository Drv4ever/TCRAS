import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster, toast } from 'sonner';
import { Header } from './components/Header';
import { FileDropzone } from './components/FileDropzone';
import { DestinationInput } from './components/DestinationInput';
import { RiskAnalysisCard } from './components/RiskAnalysisCard';
import { SendButton } from './components/SendButton';
import { SettingsDialog } from './components/SettingsDialog';
import { StatusBar } from './components/StatusBar';

function AppContent() {
  const [activeView, setActiveView] = useState('sender');
  const [transferMode, setTransferMode] = useState('lan');

  const [localIP, setLocalIP] = useState('Unknown');
  const [isConnected, setIsConnected] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [isHashing, setIsHashing] = useState(false);
  const [hashProgress, setHashProgress] = useState(0);

  const [targetIP, setTargetIP] = useState('');
  const [riskScore, setRiskScore] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Normal Path');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState(null);

  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({ threshold: 75, autoDetect: true, serverPort: 5000 });

  // Cloud mode states
  const [cloudSenderId, setCloudSenderId] = useState('sender-01');
  const [cloudReceiverId, setCloudReceiverId] = useState('receiver-01');
  const [cloudDeviceId, setCloudDeviceId] = useState('receiver-01');
  const [cloudReceiverOnline, setCloudReceiverOnline] = useState(false);
  const [cloudInbox, setCloudInbox] = useState([]);
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // LAN receiver states
  const [receiverTargetIP, setReceiverTargetIP] = useState('127.0.0.1');
  const [receiverConnected, setReceiverConnected] = useState(false);
  const [receiverReason, setReceiverReason] = useState('');
  const [receiverFiles, setReceiverFiles] = useState([]);

  const apiBaseUrl = useMemo(() => {
    const envBase = import.meta.env.VITE_API_BASE_URL;
    return envBase || `http://localhost:${config.serverPort}`;
  }, [config.serverPort]);

  const normalizeHost = (value) =>
    String(value || '')
      .trim()
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .split(':')[0];

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '-';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const computeHash = async (file) => {
    setIsHashing(true);
    setHashProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 80));
      setHashProgress(i);
    }
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    setIsHashing(false);
    return hashHex;
  };

  const handleFileSelect = async (file, metadata) => {
    setRawFile(file);
    setSelectedFile(metadata);
    setUploadedFilePath(null);
    setRiskScore(0);
    setStatusMessage('Normal Path');

    const hash = await computeHash(file);
    const updatedMetadata = { ...metadata, hash };
    setSelectedFile(updatedMetadata);

    if (transferMode === 'lan') {
      const destinationHost = normalizeHost(targetIP);
      if (destinationHost) analyzeRisk(file, destinationHost, updatedMetadata);
    }
  };

  const analyzeRisk = async (file, ip, existingMetadata = null) => {
    if (!file || !ip) return;
    setIsAnalyzing(true);
    setUploadedFilePath(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('destinationIP', ip);

      const response = await fetch(`${apiBaseUrl}/api/upload`, { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Risk analysis failed');

      const backendRiskScore = Number.isFinite(data?.risk?.score) ? data.risk.score : 0;
      const adjusted = data?.risk?.allowed ? backendRiskScore : Math.max(backendRiskScore, config.threshold + 1);

      setRiskScore(Math.max(0, Math.min(100, adjusted)));
      setStatusMessage(data?.risk?.reason || data?.message || 'Risk analysis completed');
      setUploadedFilePath(data?.file?.path || null);

      const baseMetadata = existingMetadata || selectedFile || {};
      setSelectedFile({
        ...baseMetadata,
        name: data?.file?.originalName || baseMetadata.name || file.name,
        size: data?.file?.size || baseMetadata.size || file.size,
        hash: data?.file?.hash || baseMetadata.hash,
      });
    } catch (error) {
      setRiskScore(0);
      const message = error.message || 'Backend risk analysis failed';
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (transferMode !== 'lan') return;
    const destinationHost = normalizeHost(targetIP);
    if (rawFile && destinationHost && selectedFile?.hash) {
      analyzeRisk(rawFile, destinationHost);
    }
  }, [targetIP, selectedFile?.hash, rawFile, transferMode]);

  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`);
        if (!response.ok) throw new Error('Health check failed');
        setIsConnected(true);
        const host = window.location.hostname;
        setLocalIP(host === 'localhost' ? '127.0.0.1' : host);
      } catch (_) {
        setIsConnected(false);
      }
    };

    checkServerHealth();
    const intervalId = setInterval(checkServerHealth, 8000);
    return () => clearInterval(intervalId);
  }, [apiBaseUrl]);

  const handleDetectNearby = () => {
    const mockIP = `192.168.1.${Math.floor(Math.random() * 200 + 1)}`;
    setTargetIP(mockIP);
    toast.success(`Found device at ${mockIP}`);
  };

  const checkCloudReceiver = async () => {
    if (!cloudReceiverId) return toast.error('Enter receiver device ID');
    try {
      const response = await fetch(`${apiBaseUrl}/api/cloud/devices/${cloudReceiverId}/status`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Status check failed');
      setCloudReceiverOnline(Boolean(data.online));
      toast[data.online ? 'success' : 'error'](data.online ? 'Receiver online' : 'Receiver offline');
    } catch (error) {
      toast.error(error.message || 'Status check failed');
    }
  };

  const handleTransfer = async () => {
    if (!rawFile) return toast.error('Select file first');

    setIsTransferring(true);
    toast.loading('Initiating transfer...', { id: 'transfer' });

    try {
      if (transferMode === 'lan') {
        const destinationHost = normalizeHost(targetIP);
        if (!selectedFile || !destinationHost || !uploadedFilePath) {
          throw new Error('Run risk analysis first before LAN transfer');
        }

        const response = await fetch(`${apiBaseUrl}/api/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: uploadedFilePath, destinationIP: destinationHost }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || 'Transfer failed');
        toast.success(data.message || `File received by ${targetIP}`, { id: 'transfer' });
      } else {
        if (!cloudSenderId || !cloudReceiverId) throw new Error('Set sender and receiver device IDs');

        await fetch(`${apiBaseUrl}/api/cloud/devices/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: cloudSenderId }),
        });

        const formData = new FormData();
        formData.append('file', rawFile);
        formData.append('senderId', cloudSenderId);
        formData.append('receiverId', cloudReceiverId);

        const response = await fetch(`${apiBaseUrl}/api/cloud/upload`, { method: 'POST', body: formData });
        const data = await response.json();
        if (!response.ok) {
          if (Number.isFinite(data?.risk?.score)) {
            setRiskScore(Math.max(0, Math.min(100, data.risk.score)));
            setStatusMessage(data?.risk?.reason || data?.error || 'Cloud upload blocked');
          }
          throw new Error(data.message || data.error || 'Cloud upload failed');
        }
        const cloudRiskScore = Number.isFinite(data?.risk?.score) ? data.risk.score : 0;
        setRiskScore(Math.max(0, Math.min(100, cloudRiskScore)));
        setStatusMessage(data?.risk?.reason || 'Cloud risk analysis completed');

        toast.success(`Cloud transfer queued (${data.transferId})`, { id: 'transfer' });
      }

      setTimeout(() => {
        setSelectedFile(null);
        setRawFile(null);
        setTargetIP('');
        setRiskScore(0);
        setStatusMessage('Normal Path');
        setUploadedFilePath(null);
      }, 500);
    } catch (error) {
      toast.error(error.message || 'Transfer failed', { id: 'transfer' });
    } finally {
      setIsTransferring(false);
    }
  };

  const checkReceiverConnection = async () => {
    const targetHost = normalizeHost(receiverTargetIP);
    if (!targetHost) return toast.error('Enter a valid receiver IP');

    try {
      const response = await fetch(`${apiBaseUrl}/api/receiver/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetIP: targetHost }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Receiver check failed');

      setReceiverConnected(Boolean(data.connected));
      setReceiverReason(data.reason || '');
    } catch (error) {
      setReceiverConnected(false);
      setReceiverReason(error.message || 'Receiver check failed');
      toast.error(error.message || 'Receiver check failed');
    }
  };

  const loadLanReceiverFiles = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/receiver/files`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to load files');
      setReceiverFiles(Array.isArray(data.files) ? data.files : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load receiver files');
    }
  };

  const setLanReviewStatus = async (filename, reviewed) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/receiver/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, reviewed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to update review status');
      loadLanReceiverFiles();
    } catch (error) {
      toast.error(error.message || 'Failed to update review status');
    }
  };

  const registerCloudDevice = async () => {
    if (!cloudDeviceId) return toast.error('Enter device ID');
    try {
      const response = await fetch(`${apiBaseUrl}/api/cloud/devices/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: cloudDeviceId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Register failed');
      toast.success(`Device ${data.deviceId} registered`);
    } catch (error) {
      toast.error(error.message || 'Register failed');
    }
  };

  const loadCloudInbox = async () => {
    if (!cloudDeviceId) return;
    setIsCloudLoading(true);
    try {
      const hb = await fetch(`${apiBaseUrl}/api/cloud/devices/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: cloudDeviceId }),
      });
      if (!hb.ok) {
        const err = await hb.json();
        throw new Error(err.error || 'Heartbeat failed');
      }

      const response = await fetch(`${apiBaseUrl}/api/cloud/inbox/${cloudDeviceId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to load inbox');
      setCloudInbox(Array.isArray(data.files) ? data.files : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load cloud inbox');
    } finally {
      setIsCloudLoading(false);
    }
  };

  const ackCloudTransfer = async (transferId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/cloud/ack/${transferId}`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Ack failed');
      loadCloudInbox();
    } catch (error) {
      toast.error(error.message || 'Ack failed');
    }
  };

  useEffect(() => {
    if (activeView !== 'receiver') return;

    if (transferMode === 'lan') {
      loadLanReceiverFiles();
      const timer = setInterval(loadLanReceiverFiles, 5000);
      return () => clearInterval(timer);
    }

    loadCloudInbox();
    const timer = setInterval(loadCloudInbox, 7000);
    return () => clearInterval(timer);
  }, [activeView, transferMode, cloudDeviceId, apiBaseUrl]);

  const canAnalyze = selectedFile && targetIP && selectedFile.hash;
  const canSend = transferMode === 'lan' ? (!canAnalyze || isAnalyzing) : (!selectedFile || !rawFile);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <StatusBar localIP={localIP} isConnected={isConnected} />
      <Header onSettingsClick={() => setShowSettings(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setActiveView('sender')} className={`px-4 py-2 rounded-md text-sm border ${activeView === 'sender' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-900'}`}>Sender</button>
          <button type="button" onClick={() => setActiveView('receiver')} className={`px-4 py-2 rounded-md text-sm border ${activeView === 'receiver' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-900'}`}>Receiver</button>
          <button type="button" onClick={() => setTransferMode('lan')} className={`px-4 py-2 rounded-md text-sm border ${transferMode === 'lan' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-900'}`}>LAN Mode</button>
          <button type="button" onClick={() => setTransferMode('cloud')} className={`px-4 py-2 rounded-md text-sm border ${transferMode === 'cloud' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-900'}`}>Cloud Mode</button>
        </div>

        {activeView === 'sender' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Select File</h2>
                  <FileDropzone onFileSelect={handleFileSelect} selectedFile={selectedFile} isHashing={isHashing} hashProgress={hashProgress} />
                </div>

                {transferMode === 'lan' ? (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Destination</h2>
                    <DestinationInput value={targetIP} onChange={setTargetIP} onDetectNearby={handleDetectNearby} />
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cloud Routing</h2>
                    <input value={cloudSenderId} onChange={(e) => setCloudSenderId(e.target.value)} placeholder="Sender Device ID" className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 px-3 text-sm bg-white dark:bg-gray-900" />
                    <input value={cloudReceiverId} onChange={(e) => setCloudReceiverId(e.target.value)} placeholder="Receiver Device ID" className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 px-3 text-sm bg-white dark:bg-gray-900" />
                    <button type="button" onClick={checkCloudReceiver} className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm">Check Receiver Online</button>
                    <p className={`text-sm ${cloudReceiverOnline ? 'text-green-600' : 'text-red-600'}`}>{cloudReceiverOnline ? 'Receiver appears online' : 'Receiver appears offline'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Security Analysis</h2>
                  {transferMode === 'lan' ? (
                    canAnalyze ? (
                      <RiskAnalysisCard riskScore={riskScore} statusMessage={statusMessage} isAnalyzing={isAnalyzing} />
                    ) : (
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-10 text-center text-sm text-gray-500">Select file and destination to run analysis</div>
                    )
                  ) : (
                    <RiskAnalysisCard
                      riskScore={riskScore}
                      statusMessage={statusMessage || 'Cloud mode routes file via backend storage.'}
                      isAnalyzing={isTransferring}
                    />
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Transfer Control</h2>
                  <SendButton
                    riskScore={riskScore}
                    threshold={config.threshold}
                    isTransferring={isTransferring}
                    isDisabled={canSend}
                    onClick={handleTransfer}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {transferMode === 'lan' ? (
              <>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">LAN Receiver Connection</h2>
                  <div className="flex gap-3">
                    <input value={receiverTargetIP} onChange={(e) => setReceiverTargetIP(e.target.value)} className="flex-1 h-10 rounded-md border border-gray-300 dark:border-gray-700 px-3 text-sm bg-white dark:bg-gray-900" />
                    <button type="button" onClick={checkReceiverConnection} className="h-10 px-4 rounded-md bg-indigo-600 text-white text-sm">Connect</button>
                  </div>
                  <p className={`text-sm ${receiverConnected ? 'text-green-600' : 'text-red-600'}`}>{receiverConnected ? 'Connected' : 'Not Connected'} {receiverReason ? `(${receiverReason})` : ''}</p>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Received Files (LAN)</h2>
                    <button type="button" onClick={loadLanReceiverFiles} className="h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 text-sm">Refresh</button>
                  </div>
                  {receiverFiles.length === 0 ? <p className="text-sm text-gray-500">No files received yet.</p> : (
                    <div className="space-y-2">
                      {receiverFiles.map((file) => (
                        <div key={`${file.filename}-${file.modified}`} className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.filename}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(file.modified).toLocaleString()} {file.reviewed ? '• Reviewed' : '• Pending Review'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-300">{formatFileSize(file.size)}</span>
                            <a
                              href={`${apiBaseUrl}/api/receiver/download/${encodeURIComponent(file.filename)}`}
                              className="h-8 px-3 inline-flex items-center rounded-md bg-indigo-600 text-white text-xs"
                            >
                              Download
                            </a>
                            <button
                              type="button"
                              onClick={() => setLanReviewStatus(file.filename, !file.reviewed)}
                              className="h-8 px-3 rounded-md border border-gray-300 dark:border-gray-700 text-xs"
                            >
                              {file.reviewed ? 'Unmark Review' : 'Mark Reviewed'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cloud Receiver Device</h2>
                  <div className="flex gap-3">
                    <input value={cloudDeviceId} onChange={(e) => setCloudDeviceId(e.target.value)} placeholder="Receiver Device ID" className="flex-1 h-10 rounded-md border border-gray-300 dark:border-gray-700 px-3 text-sm bg-white dark:bg-gray-900" />
                    <button type="button" onClick={registerCloudDevice} className="h-10 px-4 rounded-md bg-blue-600 text-white text-sm">Register</button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cloud Inbox</h2>
                    <button type="button" onClick={loadCloudInbox} className="h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 text-sm">{isCloudLoading ? 'Refreshing...' : 'Refresh'}</button>
                  </div>
                  {cloudInbox.length === 0 ? <p className="text-sm text-gray-500">No cloud files yet.</p> : (
                    <div className="space-y-2">
                      {cloudInbox.map((file) => (
                        <div key={file.transferId} className="rounded-md border border-gray-200 dark:border-gray-800 px-3 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.filename}</p>
                              <p className="text-xs text-gray-500">From: {file.senderId} • {new Date(file.createdAt).toLocaleString()}</p>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">{formatFileSize(file.size)}</span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <a href={`${apiBaseUrl}${file.downloadUrl}`} className="h-8 px-3 inline-flex items-center rounded-md bg-indigo-600 text-white text-xs">Download</a>
                            <button type="button" onClick={() => ackCloudTransfer(file.transferId)} className="h-8 px-3 rounded-md border border-gray-300 dark:border-gray-700 text-xs">Mark Received</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} config={config} onConfigChange={setConfig} />
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <AppContent />
    </ThemeProvider>
  );
}
