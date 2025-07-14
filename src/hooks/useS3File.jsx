import { createSignedUrlFromS3Url, downloadFile } from '@/utils/file';
import { useState } from 'react';
import { toast } from 'sonner';

export default function useS3File() {
	const [isDownloading, setIsDownloading] = useState(false);
	const [isOpening, setIsOpening] = useState(false);
	const [isCreatingS3File, setIsCreatingS3File] = useState(false);

	const downloadS3File = async (s3Url, fileName) => {
		try {
			setIsDownloading(true);
			const signedUrl = await createSignedUrlFromS3Url(s3Url);
			downloadFile(signedUrl, fileName);
		} catch (error) {
			toast.error(
				`Error downloading file: ${error?.response?.data?.message || error?.message}`,
			);
			console.log(error);
		} finally {
			setIsDownloading(false);
		}
	};

	const openS3File = async (s3Url) => {
		try {
			setIsOpening(true);
			const signedUrl = await createSignedUrlFromS3Url(s3Url);
			window.open(signedUrl, '_blank');
		} catch (error) {
			toast.error(
				`Error opening file: ${error?.response?.data?.message || error?.message}`,
			);
			console.log(error);
		} finally {
			setIsOpening(false);
		}
	};

	const createS3File = async (s3Url) => {
		try {
			setIsCreatingS3File(true);
			const signedUrl = await createSignedUrlFromS3Url(s3Url);
			return signedUrl;
		} catch (error) {
			toast.error(
				`Error creating signed file url: ${error?.response?.data?.message || error?.message}`,
			);
		} finally {
			setIsCreatingS3File(false);
		}
	};

	return {
		isDownloading,
		isOpening,
		downloadS3File,
		openS3File,
		createS3File,
		isCreatingS3File,
	};
}
