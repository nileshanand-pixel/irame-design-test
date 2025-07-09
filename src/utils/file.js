import axiosClientV1 from "@/lib/axios";
import { removeQueryString } from "./url";

export const isImageFile = (file) => {
    return file.type.includes("image");
}

export function isImageUrl(url) {
  const urlWithoutQueryString = removeQueryString(url);
  return /\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i.test(urlWithoutQueryString);
}

export function getFileType(file) {
  if (!file || !file.type) return '';

  const mime = file.type;

  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'text/csv' || mime === 'application/vnd.ms-excel') return 'csv';

  return '';
}

export const createSignedUrlFromS3Url = async (s3Url) => {
    const url = removeQueryString(s3Url);
    const resp = await axiosClientV1.get(`/files/signed-url?file_url=${decodeURI(url)}`);
    return resp?.data?.presigned_url;
}

export const downloadFile = (fileUrl, fileName) => {
  if(fileName) {
     fetch(fileUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.blob();
    })
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch(err => console.error('Download failed:', err));
  } else {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }
}