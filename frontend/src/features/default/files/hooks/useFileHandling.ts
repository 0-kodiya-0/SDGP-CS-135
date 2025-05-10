import { useState, useEffect, useCallback } from 'react';
import filesStore from '../../../../conf/localforage/localforage.conf';

export interface UploadedFile {
  name: string;
  type: string;
  data: string;
}

interface FileHandlingResult {
  selectedFile: UploadedFile | null;
  setSelectedFileByName: (fileName: string | null) => Promise<void>;
  readFile: (fileName: string) => Promise<UploadedFile | null>;
  writeFile: (file: UploadedFile) => Promise<void>;
  deleteFile: (fileName: string) => Promise<void>;
  listFiles: () => Promise<UploadedFile[]>;
  mimeTypeFromExtension: (fileName: string) => string;
  isLoading: boolean;
  refreshFiles: () => Promise<void>;
  files: UploadedFile[];
  uploadFiles: (fileList: File) => Promise<void>;
  saveFile: (content: string, fileName: string, mimeType?: string) => Promise<void>;
}

export function useFileHandling(): FileHandlingResult {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const readFile = useCallback(async (fileName: string): Promise<UploadedFile | null> => {
    setIsLoading(true);
    try {
      const file = await filesStore.getItem<UploadedFile>(fileName);
      return file || null;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const writeFile = useCallback(async (file: UploadedFile): Promise<void> => {
    setIsLoading(true);
    try {
      await filesStore.setItem(file.name, file);
      await refreshFiles();
    } catch (error) {
      console.error('Error writing file:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileName: string): Promise<void> => {
    setIsLoading(true);
    try {
      await filesStore.removeItem(fileName);
      if (selectedFile?.name === fileName) {
        setSelectedFile(null);
      }
      await refreshFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const listFiles = useCallback(async (): Promise<UploadedFile[]> => {
    setIsLoading(true);
    try {
      const keys = await filesStore.keys();
      const storedFiles = await Promise.all(
        keys.map(async (key) => await filesStore.getItem<UploadedFile>(key))
      );
      return storedFiles.filter(Boolean) as UploadedFile[];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSelectedFileByName = useCallback(async (fileName: string | null): Promise<void> => {
    if (fileName === null) {
      setSelectedFile(null);
    } else {
      const file = await readFile(fileName);
      setSelectedFile(file);
    }
  }, [readFile]);

  const refreshFiles = useCallback(async (): Promise<void> => {
    const storedFiles = await listFiles();
    setFiles(storedFiles);
  }, [listFiles]);

  const mimeTypeFromExtension = useCallback((fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': return 'application/javascript';
      case 'ts': return 'application/typescript';
      case 'tsx':
      case 'jsx': return 'text/jsx';
      case 'py': return 'text/x-python';
      case 'java': return 'text/x-java-source';
      case 'cpp': return 'text/x-c++src';
      case 'c': return 'text/x-csrc';
      case 'cs': return 'text/x-csharp';
      case 'html': return 'text/html';
      case 'css': return 'text/css';
      case 'json': return 'application/json';
      case 'xml': return 'application/xml';
      case 'sql': return 'text/sql';
      case 'sh': return 'application/x-shellscript';
      case 'pdf': return 'application/pdf';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      default: return 'text/plain';
    }
  }, []);

  const uploadFiles = useCallback(async (file: File): Promise<void> => {
    setIsLoading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploadedFile: UploadedFile = {
        name: file.name,
        type: file.type || mimeTypeFromExtension(file.name),
        data: dataUrl,
      };

      await writeFile(uploadedFile);
      await refreshFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [writeFile, refreshFiles, mimeTypeFromExtension]);

  const saveFile = useCallback(async (content: string, fileName: string, mimeType?: string): Promise<void> => {
    setIsLoading(true);
    try {
      const fileMimeType = mimeType || mimeTypeFromExtension(fileName);
      const dataUrl = `data:${fileMimeType};base64,${btoa(content)}`;

      const file: UploadedFile = {
        name: fileName,
        type: fileMimeType,
        data: dataUrl,
      };

      await writeFile(file);
      await refreshFiles();
    } catch (error) {
      console.error('Error saving file:', error);
    } finally {
      setIsLoading(false);
    }
  }, [writeFile, refreshFiles, mimeTypeFromExtension]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  return {
    selectedFile,
    setSelectedFileByName,
    readFile,
    writeFile,
    deleteFile,
    listFiles,
    mimeTypeFromExtension,
    isLoading,
    refreshFiles,
    files,
    uploadFiles,
    saveFile,
  };
}
