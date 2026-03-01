export function StatusBar({ localIP, isConnected }) {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-medium">Node:</span>
              <span className="font-mono">{localIP}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span>{isConnected ? 'Server Connected' : 'Disconnected'}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            TCRAS v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
