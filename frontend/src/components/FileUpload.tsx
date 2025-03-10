import React, { useState, useEffect, useRef, DragEvent } from "react";
import "./FileUpload.css";

interface FileItem {
  id: string;
  file: File;
  preview: string;
  isUploaded: boolean;
}

const ImprovedFileUpload: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load previously uploaded files from localStorage
  useEffect(() => {
    try {
      const storedFiles = JSON.parse(localStorage.getItem("uploadedFiles") || "[]");
      // We can't store File objects in localStorage, so we only load metadata
      // In a real app, you'd fetch the actual files from your backend
      setUploadedFiles(storedFiles);
    } catch (error) {
      console.error("Failed to load files from localStorage", error);
    }
  }, []);

  // Generate file previews
  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: FileItem[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Check file type and size
      if (!validateFile(file)) continue;
      
      const preview = await createFilePreview(file);
      newFiles.push({
        id: `selected-${Date.now()}-${i}`,
        file,
        preview,
        isUploaded: false
      });
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 25 * 1024 * 1024; // 25MB
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf', 'video/mp4', 'text/plain'];
    
    if (file.size > maxSize) {
      alert(`File ${file.name} exceeds the 25MB size limit.`);
      return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
      alert(`File ${file.name} type (${file.type}) is not supported.`);
      return false;
    }
    
    return true;
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(event.target.files);
    // Reset input to allow selecting the same file again
    event.target.value = '';
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFilesSelected(droppedFiles);
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    // Simulate upload process with timeout
    setTimeout(() => {
      const filesToUpload = selectedFiles.map(fileItem => ({
        ...fileItem,
        isUploaded: true
      }));
      
      const newUploadedFiles = [...uploadedFiles, ...filesToUpload];
      setUploadedFiles(newUploadedFiles);
      setSelectedFiles([]);
      
      // Store in localStorage - in a real app, you'd send to server
      try {
        localStorage.setItem("uploadedFiles", JSON.stringify(newUploadedFiles));
      } catch (error) {
        console.error("Failed to save to localStorage", error);
      }
      
      setIsUploading(false);
    }, 1500);
  };

  const handleRemoveSelected = (id: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleDownload = (fileItem: FileItem) => {
    const link = document.createElement("a");
    link.href = fileItem.preview;
    link.download = fileItem.file.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== id);
    setUploadedFiles(updatedFiles);
    
    // Update localStorage
    try {
      localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
    } catch (error) {
      console.error("Failed to update localStorage", error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderFilePreview = (fileItem: FileItem) => {
    const { file, preview } = fileItem;
    const fileType = file.type;

    if (fileType.startsWith("image/")) {
      return <img src={preview} alt={file.name} className="preview-thumbnail" />;
    } else if (fileType === "application/pdf") {
      return (
        <div className="file-icon pdf-icon">
          <span>PDF</span>
        </div>
      );
    } else if (fileType.startsWith("video/")) {
      return <video src={preview} className="preview-thumbnail" />;
    } else if (fileType.startsWith("text/")) {
      return (
        <div className="file-icon text-icon">
          <span>TXT</span>
        </div>
      );
    } else {
      return (
        <div className="file-icon generic-icon">
          <span>FILE</span>
        </div>
      );
    }
  };

  return (
    <div className="file-upload-container">
      <div className="upload-section">
        <h2>File Uploader</h2>
        <p className="file-info">
          Select files to upload. Supported formats: PNG, JPG, PDF, MP4, TXT<br />
          Maximum size: 25MB
        </p>

        {/* Drag & Drop Area */}
        <div 
          className={`drop-zone ${isDragging ? 'active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {selectedFiles.length === 0 ? (
            <>
              <div className="upload-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                </svg>
              </div>
              <p>Drag & Drop files here or <button onClick={handleBrowseClick} className="browse-button">Browse</button></p>
            </>
          ) : (
            <div className="selected-files-preview">
              {selectedFiles.map(fileItem => (
                <div key={fileItem.id} className="selected-file-item">
                  <div className="preview-wrapper">
                    {renderFilePreview(fileItem)}
                    <button 
                      className="remove-file-btn" 
                      onClick={() => handleRemoveSelected(fileItem.id)}
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                  <div className="file-details">
                    <div className="file-name" title={fileItem.file.name}>
                      {fileItem.file.name.length > 15 
                        ? fileItem.file.name.substring(0, 12) + '...' 
                        : fileItem.file.name}
                    </div>
                    <div className="file-size">{formatFileSize(fileItem.file.size)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          style={{ display: 'none' }}
          accept=".png,.jpg,.jpeg,.pdf,.mp4,.txt"
        />

        <button 
          className={`upload-button ${selectedFiles.length ? 'active' : 'disabled'}`}
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
        >
          {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length ? `(${selectedFiles.length} files)` : ''}`}
        </button>
      </div>

      {/* Uploaded Files Gallery */}
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-section">
          <h3>Uploaded Files</h3>
          <div className="files-gallery">
            {uploadedFiles.map(fileItem => (
              <div key={fileItem.id} className="file-card">
                <div className="file-preview">
                  {renderFilePreview(fileItem)}
                </div>
                <div className="file-info-panel">
                  <div className="file-name" title={fileItem.file.name}>
                    {fileItem.file.name.length > 20
                      ? fileItem.file.name.substring(0, 17) + '...'
                      : fileItem.file.name}
                  </div>
                  <div className="file-size">{formatFileSize(fileItem.file.size)}</div>
                </div>
                <div className="file-actions">
                  <button
                    onClick={() => handleDownload(fileItem)}
                    className="action-button download-button"
                    title="Download"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(fileItem.id)}
                    className="action-button delete-button"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Full Preview Modal would go here - implementing a basic version */}
          {/* For a complete solution, you'd create a modal component */}
        </div>
      )}
    </div>
  );
};

export default ImprovedFileUpload;