import { useCallback, useState, useEffect } from "react";
import { uploadFile } from '@/components/features/configuration/service/configuration.service';
import { getToken } from '@/lib/utils';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export function useFileUploadsV2() {
    const [files, setFiles] = useState([]);
    const [progress, setProgress] = useState({});
    const [uploadQueue, setUploadQueue] = useState([]);
    const [uploadedMetadata, setUploadedMetadata] = useState({});
    const [cancelTokens, setCancelTokens] = useState({});

    const isAllFilesUploaded =
		files.length > 0 && files.every((file) => progress[file.name] === 100);
        
    const addFiles = useCallback((fileList) => {
        const newFiles = [];
        const newProgress = {};

        const filesArr = Array.from(fileList);

        filesArr.forEach((file) => {
            if (files.some((f) => f.name === file.name)) return;

            const fileId = uuidv4();
            const fileWithStatus = Object.assign(file, { status: 'uploading', id: fileId });
            newFiles.push(fileWithStatus);
            newProgress[file.name] = 0;
        });

        setFiles((prev) => [...prev, ...newFiles]);
        setProgress((prev) => ({ ...prev, ...newProgress }));
        setUploadQueue((prev) => [...prev, ...newFiles]);        
    }, [files]);

    const removeFile = useCallback((fileName) => {
        if (cancelTokens[fileName]) {
            cancelTokens[fileName].cancel(`User removed ${fileName} mid-upload`);
        }
        setFiles((prev) => prev.filter((file) => file.name !== fileName));
        setProgress((prev) => {
            const updated = { ...prev };
            delete updated[fileName];
            return updated;
        });
        setCancelTokens((prev) => {
            const updated = { ...prev };
            delete updated[fileName];
            return updated;
        });
        setUploadQueue((prev) => prev.filter((file) => file.name !== fileName));
        setUploadedMetadata((prev) => {
            const updated = { ...prev };
            delete updated[fileName];
            return updated;
        });
    }, [cancelTokens]); 

    const uploadFiles = useCallback(async () => {
        const updatedUploadQueue = [...uploadQueue];

        while (updatedUploadQueue.length > 0) {
            const file = updatedUploadQueue.shift();

            uploadSingleFile(file)
                .catch(() => {})
                .finally(() => {});
        }
        setUploadQueue([...updatedUploadQueue]);
        // eslint-disable-next-line
    }, [uploadQueue]);

    const uploadSingleFile = async(file) => {
        if(!file) return;
        const source = axios.CancelToken.source();
        setCancelTokens((prev) => ({ ...prev, [file.name]: source }));

        try {
			const data = await uploadFile(
				file,
				setProgress,
				getToken(),
				source.token,
			);
			setProgress((prev) => ({ ...prev, [file.name]: 100 }));
			setFiles((prev) =>
				prev.map((f) => {
					if (f.name === file.name) {
						const newF = Object.assign(f, {
							status: 'ready',
						});	
						return newF;
					}
					return f;
				}),
			);
            setCancelTokens((prev) => {
                const updated = { ...prev };
                delete updated[file.name];
                return updated;
            });
			setUploadedMetadata((prev) => ({
				...prev,
				[file.id]: { ...data, id: file.id, type: file.type},
			}));
		} catch (err) {
			if (!axios.isCancel(err)) {
				setProgress((prev) => ({ ...prev, [file.name]: 0 }));
			}
		}
    }

    useEffect(() => {
        if (uploadQueue.length > 0) {
            uploadFiles();
        }
        // eslint-disable-next-line
    }, [uploadQueue]);

    const resetUploads = useCallback(() => {
		Object.values(cancelTokens).forEach((cToken) =>
			cToken?.cancel('Reset uploads'),
		);
		setFiles([]);
		setProgress({});
		setCancelTokens({});
		setUploadQueue([]);
		setUploadedMetadata({});
	}, [cancelTokens]);

    return {
		files,
		progress,
		addFiles,
		removeFile,
		uploadedMetadata,
		resetUploads,
        isAllFilesUploaded
	};
}