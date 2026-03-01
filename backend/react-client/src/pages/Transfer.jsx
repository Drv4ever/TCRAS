import { useState } from 'react';
import axios from 'axios';
import FileUpload from '../components/FileUpload';
import RiskBadge from '../components/RiskBadge';

function Transfer() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [destinationIP, setDestinationIP] = useState('192.168.1.100');
    const [riskResult, setRiskResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [uploadedFilePath, setUploadedFilePath] = useState(null);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    };

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        setRiskResult(null);
        setUploadedFilePath(null);
        addLog(`File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    };

    const handleVerifyAndUpload = async () => {
        if (!selectedFile) {
            alert('Please select a file first');
            return;
        }

        if (!destinationIP) {
            alert('Please enter a destination IP');
            return;
        }

        setLoading(true);
        addLog('Uploading file and verifying risk...');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('destinationIP', destinationIP);

            const response = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const { risk, file } = response.data;
            setRiskResult(risk);
            setUploadedFilePath(file.path);

            addLog(`Risk assessment complete: ${risk.level} (${risk.score}%)`);
            addLog(`Reason: ${risk.reason}`);

            if (risk.offline) {
                addLog('⚠️ AI server offline - using fallback assessment');
            }

        } catch (error) {
            console.error('Upload error:', error);
            addLog(`❌ Error: ${error.response?.data?.message || error.message}`);
            alert('Upload failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (!uploadedFilePath) {
            alert('Please upload and verify file first');
            return;
        }

        if (riskResult && !riskResult.allowed) {
            alert('Transfer blocked by security policy');
            return;
        }

        if (riskResult && riskResult.level === 'MEDIUM') {
            const confirm = window.confirm(
                `Risk level is MEDIUM (${riskResult.score}%). Proceed with transfer?`
            );
            if (!confirm) return;
        }

        setLoading(true);
        addLog(`Initiating transfer to ${destinationIP}...`);

        try {
            const response = await axios.post('/api/transfer', {
                filePath: uploadedFilePath,
                destinationIP: destinationIP,
                destinationPort: 9999
            });

            addLog('✅ Transfer completed successfully');
            alert('File transferred successfully!');

            // Reset
            setSelectedFile(null);
            setRiskResult(null);
            setUploadedFilePath(null);

        } catch (error) {
            console.error('Transfer error:', error);
            addLog(`❌ Transfer failed: ${error.response?.data?.message || error.message}`);
            alert('Transfer failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - Controls */}
                <div className="lg:col-span-2 space-y-6">

                    {/* File Upload Card */}
                    <div className="glass rounded-xl p-6 border border-gray-700/50">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                            Source Payload
                        </h2>
                        <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} />
                    </div>

                    {/* Destination Card */}
                    <div className="glass rounded-xl p-6 border border-gray-700/50">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                            Destination Vector
                        </h2>
                        <input
                            type="text"
                            value={destinationIP}
                            onChange={(e) => setDestinationIP(e.target.value)}
                            placeholder="192.168.1.100"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-cyber-blue transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-2">Enter target IP address</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                        <button
                            onClick={handleVerifyAndUpload}
                            disabled={loading || !selectedFile}
                            className="flex-1 bg-gradient-to-r from-cyber-blue to-cyber-purple text-white font-bold py-3 px-6 rounded-lg hover:shadow-glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'VERIFYING...' : 'VERIFY & UPLOAD'}
                        </button>

                        {uploadedFilePath && (
                            <button
                                onClick={handleTransfer}
                                disabled={loading || !riskResult?.allowed}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'TRANSFERRING...' : 'EXECUTE TRANSFER'}
                            </button>
                        )}
                    </div>

                    {/* Risk Badge */}
                    {riskResult && (
                        <RiskBadge risk={riskResult} />
                    )}
                </div>

                {/* Right Column - Logs */}
                <div className="lg:col-span-1">
                    <div className="glass rounded-xl p-6 border border-gray-700/50 h-full flex flex-col">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                            Security Event Log
                        </h2>
                        <div className="flex-1 bg-black/50 rounded-lg p-4 overflow-y-auto font-mono text-xs text-green-400 space-y-1 max-h-96">
                            {logs.length === 0 ? (
                                <p className="text-gray-600">System initialized. Ready for secure transfer.</p>
                            ) : (
                                logs.map((log, index) => (
                                    <div key={index}>{log}</div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Transfer;
