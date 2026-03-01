import { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';

export function FileDropzone({
  onFileSelect,
  selectedFile,
  isHashing,
  hashProgress,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file) => {
    const extension = file.name.split('.').pop() || '';
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const metadata = {
      name: file.name,
      size: file.size,
      extension,
      timestamp,
    };

    onFileSelect(file, metadata);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <div
        className={`
          relative border-2 border-dashed rounded-lg m-4 transition-all
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' 
            : selectedFile 
              ? 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
              : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                Drag and drop your file here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or click to browse from your computer
              </p>
            </div>
            <Button variant="outline" size="sm">
              Select File
            </Button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <File className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatFileSize(selectedFile.size)} · {selectedFile.extension.toUpperCase()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {selectedFile.timestamp}
                </p>
              </div>
            </div>

            {isHashing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Computing SHA-256 Hash...
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {hashProgress}%
                  </span>
                </div>
                <Progress value={hashProgress} className="h-2" />
              </div>
            )}

            {!isHashing && selectedFile.hash && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  SHA-256 Hash
                </div>
                <div className="text-xs font-mono text-gray-900 dark:text-gray-100 break-all">
                  {selectedFile.hash}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
