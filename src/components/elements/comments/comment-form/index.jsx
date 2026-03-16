import capitalize from 'lodash.capitalize';
import { Button } from '@/components/ui/button';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import AutoGrowingTextarea from '../../auto-growing-textarea';
import EmojiSelector from '../../emoji-selector';
import UserProfileIcon from '../../user-profile-icon';
import { Paperclip } from '@phosphor-icons/react';
import FilePicker from '../../file-picker';
import { useFileUploadsV2 } from '@/hooks/useFileUploadsV2';
import { logError } from '@/lib/logger';
import FilePreview from '../../file-preview';
import { isImageFile } from '@/utils/file';
import ImagePreview from '../../image-preview';
import { Smiley } from '@phosphor-icons/react/dist/ssr';
import { toast } from '@/lib/toast';
import { fileTypeFromBlob } from 'file-type';

export default function CommentForm({
	commetsAdder,
	onSuccessCommentAddition,
	isCommentSectionOpen,
	toastPosition = 'bottom-right',
}) {
	const [value] = useLocalStorage('userDetails');
	const [commentString, setCommentString] = useState('');
	const {
		addFiles,
		files,
		removeFile,
		progress,
		resetUploads,
		isAllFilesUploaded,
		uploadedMetadata,
	} = useFileUploadsV2();

	const commentMutation = useMutation({
		mutationFn: (payload) => commetsAdder(payload),
		onSuccess: async () => {
			toast.success('Comment added successful', { position: toastPosition });
			onSuccessCommentAddition();
			setCommentString('');
			resetUploads();
		},
		onError: (err) => {
			logError(err, {
				feature: 'comments',
				action: 'addComment',
				extra: {
					errorMessage: err.message,
				},
			});
			toast.error(`Error in Adding comment: ${err.message}`, {
				position: toastPosition,
			});
		},
	});

	const showCancelBtn = useMemo(() => {
		return commentString.length !== 0 || files.length !== 0;
	}, [commentString, files]);

	const canComment = useMemo(() => {
		if (files.length !== 0) {
			if (isAllFilesUploaded) {
				return true;
			}
			return false;
		} else if (commentString.length !== 0) {
			return true;
		}
		return false;
	}, [files, isAllFilesUploaded, commentString]);

	const handleCancelClick = () => {
		setCommentString('');
		resetUploads();
	};

	const handleContinueClick = async (e) => {
		e.preventDefault();
		const newCommentText = commentString.trim();
		if (!newCommentText && files.length === 0) {
			toast.error(`Comment can't be empty!`, { position: toastPosition });
			return;
		}

		const newComment = {};

		if (newCommentText) {
			newComment.text = newCommentText;
		}

		if (files.length !== 0) {
			const fileArray = files.map((file) => ({
				file_id: file.id,
				file_name: file.name,
				file_url: uploadedMetadata?.[file.id]?.url,
			}));
			newComment.files = fileArray;
		}

		commentMutation.mutate(newComment);
	};

	const handleEmojiSelect = (e) => {
		setCommentString((prev) => prev + e.emoji);
	};

	const getFilesWithSingleExtension = (allFiles) => {
		const singleExtensionFiles = Array.from(allFiles).filter((file) => {
			return file.name.split('.').length === 2;
		});

		return singleExtensionFiles;
	};

	const getFilesHavingCorrectType = (files, filesInfo) => {
		const filesHavingCorrectType = [];

		files?.forEach((file, index) => {
			const extInName = file.name.split('.')[1];
			const fileInfo = filesInfo[index];
			if (extInName === fileInfo?.ext) {
				filesHavingCorrectType.push(file);
			} else {
				filesHavingCorrectType.push(null);
			}
		});

		return filesHavingCorrectType;
	};

	const getAllowedFiles = (allFiles, filesInfo) => {
		// TEMPORARY: Accept all file types - TODO: Revert this change
		return [allFiles, false];

		/* ORIGINAL CODE - Uncomment to restore file type restrictions
		const allowedFiles = [];
		const allowedFileTypes = ['pdf', 'jpg', 'png', 'gif'];
		let hasNotAllowedFiles = false;

		allFiles.forEach((file, index) => {
			if (!file) return;

			if (allowedFileTypes.includes(filesInfo[index].ext)) {
				allowedFiles.push(file);
			} else {
				hasNotAllowedFiles = true;
			}
		});

		return [allowedFiles, hasNotAllowedFiles];
		*/
	};

	const getFilesInfo = async (files) => {
		const filesInfo = [];
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const fileInfo = await fileTypeFromBlob(file);
			if (fileInfo) {
				filesInfo.push(fileInfo);
			} else {
				filesInfo.push({
					ext: file?.name?.split('.')?.[1],
					type: file.type,
				});
			}
		}
		return filesInfo;
	};

	const getAllowedValidFiles = async (files) => {
		// remove files files more than 1 ext
		const singleExtensionFiles = getFilesWithSingleExtension(files);
		if (singleExtensionFiles.length !== files.length) {
			toast.error('Some files have invalid names!');
		}

		// get files info
		const filesInfo = await getFilesInfo(singleExtensionFiles);

		// remove files having incorrect ext.
		const filesHavingCorrectType = getFilesHavingCorrectType(
			singleExtensionFiles,
			filesInfo,
		);
		if (filesHavingCorrectType.includes(null)) {
			toast.error('Some files have incorrect extensions!');
		}

		// remove allowed files
		const [allowedFiles, hasNotAllowedFiles] = getAllowedFiles(
			filesHavingCorrectType,
			filesInfo,
		);
		if (hasNotAllowedFiles) {
			toast.error('Some files are not supported!');
		}

		return allowedFiles;
	};

	const handleFileSelect = async (e) => {
		const uplodedFiles = e.target.files;

		if (uplodedFiles.length === 0) {
			return;
		}

		const allowedValidFiles = await getAllowedValidFiles(uplodedFiles);

		addFiles(allowedValidFiles);
	};

	const imageFiles = useMemo(() => {
		return files.filter((file) => isImageFile(file));
	}, [files]);

	const notImageFiles = useMemo(() => {
		return files.filter((file) => !isImageFile(file));
	});

	return (
		<form
			className={`bg-[#FAF5FF] p-3 flex flex-col gap-[0.625rem] rounded-b-lg ${!isCommentSectionOpen && 'rounded-t-lg'}`}
		>
			<div className="flex flex-col gap-3 rounded-b-lg">
				<div className="flex gap-2 items-center">
					<UserProfileIcon
						userName={value?.user_name}
						userEmail={value?.email}
					/>
					<span className="text-sm font-semibold">
						{capitalize(value?.user_name)}
					</span>
				</div>

				<div className="w-full">
					<AutoGrowingTextarea
						value={commentString}
						setValue={setCommentString}
						className="placeholder:italic min-h-[0px] resize-none"
						placeholder="Write a comment"
					/>
				</div>
			</div>

			<div className="flex justify-between items-center">
				<div className="flex gap-3">
					<FilePicker
						trigger={
							<Paperclip
								color="rgba(153, 153, 153, 0.80)"
								className="cursor-pointer size-6"
							/>
						}
						onFileSelect={handleFileSelect}
					/>

					<EmojiSelector
						trigger={
							<Smiley
								className="size-6 cursor-pointer"
								color="rgba(153, 153, 153, 0.80)"
							/>
						}
						onSelect={handleEmojiSelect}
					/>
				</div>
				<div className="space-x-2">
					{showCancelBtn && (
						<Button
							size="sm"
							variant="secondary"
							onClick={handleCancelClick}
							type="button"
						>
							Cancel
						</Button>
					)}

					<Button
						size="sm"
						onClick={handleContinueClick}
						type="submit"
						disabled={!canComment}
					>
						Comment
					</Button>
				</div>
			</div>

			<div className="flex gap-3 flex-wrap">
				{imageFiles.length !== 0 &&
					imageFiles.map((imageFile) => (
						<ImagePreview
							key={imageFile.name}
							file={imageFile}
							handleCancel={removeFile}
							progress={progress[imageFile.name]}
							showProgress={true}
							canCancel={true}
						/>
					))}
			</div>
			<div className="flex gap-3 flex-wrap">
				{notImageFiles.length !== 0 &&
					notImageFiles.map((file) => (
						<FilePreview
							fileName={file.name}
							handleCancel={removeFile}
							progress={progress[file.name]}
							showProgress={true}
							canCross={true}
							key={file.name}
							fileUrl={uploadedMetadata?.[file.id]?.url}
						/>
					))}
			</div>
		</form>
	);
}
