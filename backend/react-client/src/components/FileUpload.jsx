import { useCallback } from 'react';

function FileUpload({ onFileSelect, selectedFile }) {
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-cyber-blue transition-colors cursor-pointer"
        >
            {selectedFile ? (
                <div className="space-y-2">
                    <svg className="w-12 h-12 mx-auto text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <label className="inline-block mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                        <span className="text-sm text-gray-300">Change File</span>
                        <input
                            type="file"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                    </label>
                </div>
            ) : (
                <div className="space-y-4">
                    <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                        <p className="text-gray-300 mb-2">Drag and drop file here</p>
                        <p className="text-gray-500 text-sm mb-4">or</p>
                        <label className="inline-block px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                            <span className="text-sm text-gray-300">Browse Files</span>
                            <input
                                type="file"
                                onChange={handleFileInput}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FileUpload;
