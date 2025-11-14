/**
 * File service utility for handling file URLs
 */

const FILE_SERVICE_BASE_URL = process.env.REACT_APP_FILE_SERVICE_URL || 'http://localhost:8080';

/**
 * Generate complete file URL from filename or path
 * @param {string} filePathOrName - File path or filename
 * @returns {string} Complete file URL
 */
export const getFileUrl = (filePathOrName) => {
  if (!filePathOrName) {
    return '';
  }
  
  // If it's already a complete URL, return as is
  if (filePathOrName.startsWith('http://') || filePathOrName.startsWith('https://')) {
    return filePathOrName;
  }
  
  // If it starts with '/', remove it to avoid double slashes
  const cleanPath = filePathOrName.startsWith('/') ? filePathOrName.slice(1) : filePathOrName;
  
  return `${FILE_SERVICE_BASE_URL}/${cleanPath}`;
};

/**
 * Get file service base URL
 * @returns {string} Base URL for file service
 */
export const getFileServiceBaseUrl = () => FILE_SERVICE_BASE_URL;

/**
 * Download file from URL
 * @param {string} fileUrl - Complete file URL
 * @param {string} filename - Desired filename for download
 */
export const downloadFile = async (fileUrl, filename) => {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('File download failed:', error);
    throw new Error('파일 다운로드에 실패했습니다.');
  }
};