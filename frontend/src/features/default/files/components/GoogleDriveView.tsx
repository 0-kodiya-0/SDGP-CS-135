import { useEffect, useState } from "react";
import { useDriveFiles } from "../hooks/useDriveFiles.google";
import { DriveFile } from "../types/types.google.api";
import { FiDownload, FiFile, FiImage, FiFileText, FiFolder } from "react-icons/fi";
import { useTabStore } from "../../../required/tab_view";
import { ComponentTypes } from "../../../required/tab_view/types/types.views";
import { GooglePermissionRequest, useGooglePermissions } from "../../user_account";

interface GoogleDriveViewProps {
  accountId: string;
}

export default function GoogleDriveView({ accountId }: GoogleDriveViewProps) {
  const { files, loading, error, listFiles, getDownloadUrl } = useDriveFiles(accountId);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const { addTab } = useTabStore();

  const {
    hasRequiredPermission,
    permissionsLoading,
    permissionError,
    checkAllServicePermissions,
  } = useGooglePermissions();

  useEffect(() => {
    if (accountId) {
      checkAllServicePermissions(accountId, 'drive');
    }
  }, [accountId]);

  useEffect(() => {
    if (hasRequiredPermission(accountId, 'drive', 'full')) {
      listFiles();
    }
  }, [accountId, permissionsLoading]);

  const handleFileClick = (file: DriveFile) => {
    setSelectedFile(file);
    addTab(
      accountId,
      file.name,
      ComponentTypes.FILES_DETAIL_VIEW,
      {
        selectedFile: file,
        isGoogleDrive: true,
        accountId: accountId
      }
    );
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

  if (!hasRequiredPermission(accountId, "drive", "full") && !permissionsLoading) {
    return (
      <GooglePermissionRequest
        serviceType="drive"
        requiredScopes={['full']}
        loading={permissionsLoading}
        error={permissionError}
        onRequestPermission={() => checkAllServicePermissions(accountId, 'drive', true)}
        title="Drive Access Required"
        description="To access your files and documents, we need your permission to access your Google Drive."
      />
    );
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