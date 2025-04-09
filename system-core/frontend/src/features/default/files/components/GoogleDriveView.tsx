import { useEffect, useState } from "react";
import { useDriveFiles } from "../hooks/useDriveFiles.google";
import { DriveFile } from "../types/types.google.api";
import { FiDownload, FiFile, FiImage, FiFileText,  FiFolder, FiShield } from "react-icons/fi";
import { useTabStore } from "../../../required/tab_view";
import { ComponentTypes } from "../../../required/tab_view/types/types.views";
import { useServicePermissions } from "../../user_account/hooks/useServicePermissions.google";

interface GoogleDriveViewProps {
  accountId: string;
}

export default function GoogleDriveView({ accountId }: GoogleDriveViewProps) {
  const { files, loading, error, listFiles, getDownloadUrl } = useDriveFiles(accountId);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const { addTab, setActiveTab } = useTabStore();

  const {
    permissions,
    permissionsLoading,
    permissionError,
    checkAllServicePermissions,
  } = useServicePermissions(accountId, 'drive');

  useEffect(() => {
    if (permissions?.readonly?.hasAccess) {
      listFiles();
    }
  }, [permissions?.readonly?.hasAccess]);

  const handleFileClick = (file: DriveFile) => {
    setSelectedFile(file);
    const tabId = addTab(
      file.name,
      null,
      ComponentTypes.FILES_DETAIL_VIEW,
      {
        selectedFile: file,
        isGoogleDrive: true
      }
    );
    setActiveTab(tabId);
  };

  const handleDownload = (e: React.MouseEvent, file: DriveFile) => {
    e.stopPropagation();
    const downloadUrl = getDownloadUrl(file.id);
    window.open(downloadUrl, '_blank');
  };

  const getFileIcon = (file: DriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      return <FiFolder className="text-yellow-500" />;
    }
    if (file.mimeType.startsWith('image/')) {
      return <FiImage className="text-purple-500" />;
    }
    if (file.mimeType === 'application/pdf') {
      return <FiFileText className="text-red-500" />;
    }
    if (file.mimeType.startsWith('text/')) {
      return <FiFileText className="text-blue-500" />;
    }
    if (file.mimeType.includes('document') || file.mimeType.includes('spreadsheet') || file.mimeType.includes('presentation')) {
      return <FiFileText className="text-green-500" />;
    }
    return <FiFile className="text-gray-500" />;
  };

  const renderPermissionRequest = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <FiShield className="w-16 h-16 text-blue-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Google Drive Access Required</h2>
        <p className="text-gray-600 text-center mb-6">
          To use Google Drive features, we need your permission to access your files and folders.
        </p>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => checkAllServicePermissions(true)}
          disabled={permissionsLoading}
        >
          {permissionsLoading ? 'Requesting Access...' : 'Grant Drive Access'}
        </button>
        {permissionError && (
          <p className="text-red-500 mt-4 text-sm">
            Error: {permissionError}
          </p>
        )}
        {!permissions?.readonly && (
          <p className="text-amber-600 mt-4 text-sm">
            Please accept the permission request in the popup window. If you don't see it, check if it was blocked by your browser.
          </p>
        )}
      </div>
    );
  };

  // Check if we need to show the permission request screen
  if (!permissions?.readonly?.hasAccess) {
    return renderPermissionRequest();
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-20">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-sm text-gray-500">Loading Google Drive files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Error loading Google Drive files: {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.length === 0 ? (
        <div className="text-center p-4 text-gray-500">
          No files found in Google Drive.
        </div>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              onClick={() => handleFileClick(file)}
              className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${selectedFile?.id === file.id ? "bg-blue-100 border-l-4 border-blue-500" : "bg-white"
                }`}
            >
              <div className="flex-shrink-0 mr-2">{getFileIcon(file)}</div>
              <div className="flex-grow truncate font-medium text-sm text-gray-800">
                {file.name}
              </div>
              {file.mimeType !== 'application/vnd.google-apps.folder' && (
                <button
                  onClick={(e) => handleDownload(e, file)}
                  className="text-gray-600 hover:text-blue-600 transition-colors p-1"
                  title="Download"
                >
                  <FiDownload size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}