import React, { useEffect, useState } from 'react';
import { Trash2, File, Search, ExternalLink, Clock, FileText, Download, Grid, List } from 'lucide-react';
import { useWorkspaceFeature } from '../hooks/useWorkspaceFeature';
import { WorkspaceFeatureType, WorkspaceContent } from '../types/workspace.types';

interface WorkspaceFilesProps {
    workspaceId: string;
}

const WorkspaceFiles: React.FC<WorkspaceFilesProps> = ({ workspaceId }) => {
    const {
        featureContents,
        loading,
        error,
        fetchFeatureContents,
        removeFeatureContent
    } = useWorkspaceFeature(WorkspaceFeatureType.Files);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setSelectedFile] = useState<WorkspaceContent | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Fetch files when component mounts
    useEffect(() => {
        fetchFeatureContents();
    }, [fetchFeatureContents, workspaceId]);

    // Filter files based on search query
    const filteredFiles = searchQuery
        ? featureContents.filter(file =>
            file.metadata.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.metadata.fileType?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : featureContents;

    // Handle file removal
    const handleRemoveFile = async (file: WorkspaceContent, e: React.MouseEvent) => {
        e.stopPropagation();

        if (window.confirm('Are you sure you want to remove this file from the workspace?')) {
            const success = await removeFeatureContent(file.id);

            if (success && selectedFile?.id === file.id) {
                setSelectedFile(null);
            }
        }
    };

    // Format date string
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Format file size
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown size';

        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
    };

    // Get file icon based on mime type
    const getFileIcon = (mimeType?: string) => {
        if (!mimeType) return <File className="w-12 h-12 text-gray-400" />;

        if (mimeType.includes('image/')) {
            return <img
                src={selectedFile?.metadata.thumbnailUrl || '/placeholder-image.png'}
                alt="Thumbnail"
                className="w-16 h-16 object-cover rounded border border-gray-200"
            />;
        }

        if (mimeType.includes('application/pdf')) {
            return <FileText className="w-12 h-12 text-red-500" />;
        }

        if (mimeType.includes('text/')) {
            return <FileText className="w-12 h-12 text-blue-500" />;
        }

        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
            return <FileText className="w-12 h-12 text-green-500" />;
        }

        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
            return <FileText className="w-12 h-12 text-amber-500" />;
        }

        return <File className="w-12 h-12 text-gray-400" />;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search and View Controls */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="w-1/2 relative">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                        title="Grid view"
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                        title="List view"
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4">
                {/* Loading state */}
                {loading && (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="h-full flex items-center justify-center p-4 text-center">
                        <div className="text-red-500">
                            <p>Failed to load files:</p>
                            <p className="font-medium">{error}</p>
                            <button
                                onClick={() => fetchFeatureContents()}
                                className="mt-4 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && filteredFiles.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                        <File className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500">
                            {searchQuery
                                ? 'No files match your search'
                                : 'No files shared to this workspace yet'}
                        </p>
                    </div>
                )}

                {/* Files grid view */}
                {!loading && !error && filteredFiles.length > 0 && viewMode === 'grid' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredFiles.map(file => (
                            <div
                                key={file.id}
                                onClick={() => setSelectedFile(file)}
                                className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${selectedFile?.id === file.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                                    }`}
                            >
                                <div className="p-4 flex flex-col items-center">
                                    {file.metadata.thumbnailUrl ? (
                                        <img
                                            src={file.metadata.thumbnailUrl}
                                            alt={file.metadata.title || 'File thumbnail'}
                                            className="w-16 h-16 object-cover mb-3"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 flex items-center justify-center mb-3">
                                            {getFileIcon(file.metadata.fileType)}
                                        </div>
                                    )}
                                    <h3 className="font-medium text-sm text-center line-clamp-2">
                                        {file.metadata.title || 'Untitled File'}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {file.metadata.fileType || 'Unknown type'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-2 flex justify-between items-center border-t border-gray-200">
                                    <span className="text-xs text-gray-500">
                                        {formatFileSize(file.metadata.size)}
                                    </span>
                                    <button
                                        onClick={(e) => handleRemoveFile(file, e)}
                                        className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200"
                                        title="Remove from workspace"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Files list view */}
                {!loading && !error && filteredFiles.length > 0 && viewMode === 'list' && (
                    <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Size
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Modified
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredFiles.map(file => (
                                    <tr
                                        key={file.id}
                                        onClick={() => setSelectedFile(file)}
                                        className={`cursor-pointer hover:bg-gray-50 ${selectedFile?.id === file.id ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                                                    {getFileIcon(file.metadata.fileType)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                                        {file.metadata.title || 'Untitled File'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{file.metadata.fileType || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{formatFileSize(file.metadata.size)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{formatDate(file.metadata.modifiedAt)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={(e) => handleRemoveFile(file, e)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* File details panel (displayed when a file is selected) */}
            {selectedFile && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex">
                        <div className="mr-6 flex-shrink-0">
                            {selectedFile.metadata.thumbnailUrl ? (
                                <img
                                    src={selectedFile.metadata.thumbnailUrl}
                                    alt={selectedFile.metadata.title || 'File thumbnail'}
                                    className="w-24 h-24 object-cover border border-gray-200 rounded"
                                />
                            ) : (
                                <div className="w-24 h-24 flex items-center justify-center border border-gray-200 rounded bg-white">
                                    {getFileIcon(selectedFile.metadata.fileType)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-medium text-gray-900">
                                {selectedFile.metadata.title || 'Untitled File'}
                            </h2>
                            {selectedFile.metadata.description && (
                                <p className="text-sm text-gray-500 mt-1">{selectedFile.metadata.description}</p>
                            )}
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-gray-500">Type</p>
                                    <p className="text-sm">{selectedFile.metadata.fileType || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Size</p>
                                    <p className="text-sm">{formatFileSize(selectedFile.metadata.size)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Created</p>
                                    <p className="text-sm">{formatDate(selectedFile.metadata.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Modified</p>
                                    <p className="text-sm">{formatDate(selectedFile.metadata.modifiedAt)}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex space-x-3">
                                {selectedFile.metadata.url && (
                                    <a
                                        href={selectedFile.metadata.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-1.5" />
                                        View in Drive
                                    </a>
                                )}
                                {/* Since we don't have direct download capability, link to view */}
                                <a
                                    href={selectedFile.metadata.url || `https://drive.google.com/file/d/${selectedFile.contentId}/view`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Download className="w-4 h-4 mr-1.5" />
                                    Open File
                                </a>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspaceFiles;