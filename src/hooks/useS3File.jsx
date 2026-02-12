import { createSignedUrlFromS3Url, downloadFile } from '@/utils/file';
import { useState } from 'react';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';

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
			logError(error, {
				feature: 'file_operations',
				action: 'download_s3_file',
			});
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
			logError(error, {
				feature: 'file_operations',
				action: 'open_s3_file',
			});
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
			// If it's a data URL (for mock data), return it directly
			if (s3Url && s3Url.startsWith('data:')) {
				return s3Url;
			}
			const signedUrl = await createSignedUrlFromS3Url(s3Url);
			return signedUrl;
		} catch (error) {
			logError(error, {
				feature: 'file_operations',
				action: 'create_s3_file',
			});
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
