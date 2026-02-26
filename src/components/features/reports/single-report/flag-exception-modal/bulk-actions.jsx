import React, { useMemo, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import FilePreview from '@/components/elements/file-preview';
import ImagePreview from '@/components/elements/image-preview';
import { useFileUploadsV2 } from '@/hooks/useFileUploadsV2';
import { isImageFile } from '@/utils/file';
import Flag, { FLAG_CONFIG, FLAG_TYPES } from './flag';
import { bulkUpdateReportCardCases } from '../../service/reports.service';
import { getShareableUsers } from '@/api/share.service';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { AssignedToField } from '../../ResolutionTrailModal';
import {
	validateFiles,
	getAcceptString,
	UPLOAD_CONTEXTS,
} from '@/config/file-upload.config';
import { fileTypeFromBlob } from 'file-type';

const BulkActions = ({
	isBulkActionsVisible,
	selectedCaseIds,
	onCancel,
	reportId,
	cardId,
	isSample = false,
}) => {
	const [selectedFlaggingType, setSelectedFlaggingType] = useState('');
	const [bulkAssignedUsers, setBulkAssignedUsers] = useState([]);
	const [bulkComment, setBulkComment] = useState('');
	const queryClient = useQueryClient();

	// Fetch shareable users
	const { data: shareableUsers, isLoading: isLoadingUsers } = useQuery({
		queryKey: ['shareable-users'],
		queryFn: getShareableUsers,
	});

	// Transform users data for MultiSelect
	const userOptions = useMemo(() => {
		if (!shareableUsers || !Array.isArray(shareableUsers)) return [];
		return shareableUsers;
	}, [shareableUsers]);

	const {
		addFiles,
		files,
		removeFile,
		progress,
		resetUploads,
		isAllFilesUploaded,
		uploadedMetadata,
	} = useFileUploadsV2();

	const allowedFileTypes = UPLOAD_CONTEXTS.COMMENTS;

	// Check if any bulk action is filled
	const hasAnyBulkAction = useMemo(() => {
		return (
			selectedFlaggingType ||
			bulkAssignedUsers.length > 0 ||
			bulkComment.trim() ||
			files.length > 0
		);
	}, [selectedFlaggingType, bulkAssignedUsers, bulkComment, files]);

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

	const handleFileAttachment = async (e) => {
		const uplodedFiles = e.target.files;

		if (uplodedFiles.length === 0) {
			return;
		}

		const allowedValidFiles = await getAllowedValidFiles(uplodedFiles);

		addFiles(allowedValidFiles);
	};

	// Filter image and non-image files
	const imageFiles = useMemo(() => {
		return files.filter((file) => isImageFile(file));
	}, [files]);

	const notImageFiles = useMemo(() => {
		return files.filter((file) => !isImageFile(file));
	}, [files]);

	// Bulk update mutation
	const bulkUpdateMutation = useMutation({
		mutationFn: (operations) =>
			bulkUpdateReportCardCases({
				reportId,
				cardId,
				operations,
				isSample: isSample,
			}),
		onSuccess: (_data, operations) => {
			// Invalidate and refetch cases data
			queryClient.invalidateQueries(['report-card-cases', reportId, cardId]);
			const appliedCount = operations?.[0]?.case_ids?.length ?? 0;
			const rowLabel = appliedCount === 1 ? 'row' : 'rows';
			toast.success(
				`Applied bulk action on ${appliedCount} ${rowLabel} successfully.`,
			);
			resetBulkActions();
			// Clear selection so the bulk actions panel closes.
			onCancel?.();
		},
		onError: (error) => {
			console.error('Error applying bulk actions:', error);
			toast.error(
				error?.response?.data?.message ||
					'Failed to apply bulk actions. Please try again.',
			);
		},
	});

	// Handle bulk actions
	const handleBulkActionsDone = () => {
		const fileArray = files.map((file) => ({
			file_id: file.id,
			file_name: file.name,
			file_url: uploadedMetadata?.[file.id]?.url,
		}));

		const operation = {
			case_ids: selectedCaseIds,
			updates: {},
		};

		if (selectedFlaggingType) {
			operation.updates.flagging = selectedFlaggingType;
		}

		if (bulkAssignedUsers.length > 0) {
			operation.updates.assigned_to = bulkAssignedUsers?.map(
				(user) => user.user_id,
			);
		}

		if (bulkComment) {
			operation.comment_message = bulkComment;
		}

		if (fileArray.length > 0) {
			operation.file_urls = fileArray?.map((file) => file.file_url);
		}

		// Call API
		bulkUpdateMutation.mutate([operation]);
	};

	const resetBulkActions = () => {
		setSelectedFlaggingType('');
		setBulkAssignedUsers([]);
		setBulkComment('');
		resetUploads();
	};

	const handleBulkActionsCancel = () => {
		resetBulkActions();
		onCancel?.();
	};

	return (
		<div
			className={cn(
				'transition-all duration-300 w-0',
				isBulkActionsVisible && 'w-[31.25rem]',
			)}
		>
			{isBulkActionsVisible && (
				<div className="border border-[#E5E7EB] rounded-lg p-6 flex flex-col justify-between h-[calc(100%-3.5rem)]">
					<div className="flex flex-col gap-6 overflow-auto">
						{/* Mark as Section */}
						<div>
							<label className="text-sm font-medium text-[#26064A] mb-2 block">
								Mark as
							</label>
							<Select
								value={selectedFlaggingType}
								onValueChange={setSelectedFlaggingType}
							>
								<SelectTrigger className="w-full bg-white border-[#E5E7EB]">
									{selectedFlaggingType ? (
										<div className="flex items-center gap-2">
											<Flag
												type={selectedFlaggingType}
												isActive={true}
												// onClickHandler={() => setSelectedFlaggingType(type)}
											/>
											<span className="text-sm font-medium text-[#26064ACC]">
												{
													FLAG_CONFIG?.[
														selectedFlaggingType
													]?.label
												}
											</span>
										</div>
									) : (
										<SelectValue placeholder="Select marking" />
									)}
								</SelectTrigger>
								<SelectContent>
									{Object.values(FLAG_TYPES).map((type) => (
										<SelectItem
											key={type}
											value={type}
											className="hover:bg-gray-100"
										>
											<div className="flex items-center gap-2">
												<Flag
													type={type}
													isActive={true}
													// onClickHandler={() => setSelectedFlaggingType(type)}
												/>
												<span className="text-sm font-medium text-[#26064ACC]">
													{FLAG_CONFIG?.[type]?.label}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Assign to Section */}
						<div>
							<label className="text-sm font-medium text-[#26064A] mb-2 block">
								Assign to
							</label>
							{/* <MultiSelect
								options={userOptions}
								defaultValue={bulkAssignedUsers}
								onValueChange={(selectedValues) => {
									setBulkAssignedUsers(selectedValues);
								}}
								placeholder={
									isLoadingUsers
										? 'Loading users...'
										: 'Select users'
								}
								maxCount={1}
								className="w-full bg-white border-[#E5E7EB]"
								disabled={isLoadingUsers}
								modalPopover={true}
							/> */}
							<AssignedToField
								users={userOptions}
								assignedUsers={bulkAssignedUsers}
								setAssignedUsers={(selectedValues) => {
									setBulkAssignedUsers(selectedValues);
								}}
							/>
						</div>

						{/* Add Comment Section */}
						<div>
							<label className="text-sm font-medium text-[#26064A] mb-2 block">
								Add Comment
							</label>
							<div className="border border-[#E5E7EB] rounded-lg bg-white">
								<div className="p-3">
									<textarea
										value={bulkComment}
										onChange={(e) =>
											setBulkComment(e.target.value)
										}
										placeholder="Add a comment or attachment..."
										className="w-full min-h-[60px] text-sm resize-none focus:outline-none border-none p-0"
									/>
								</div>

								{/* Bottom Actions */}
								<div className="flex items-center justify-between px-3 py-2 border-t border-[#E5E7EB]">
									<div className="flex items-center gap-2">
										<label className="cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
											<input
												type="file"
												multiple
												accept={getAcceptString(
													allowedFileTypes,
												)}
												onChange={handleFileAttachment}
												className="hidden"
											/>
											<Paperclip className="w-4 h-4 text-[#6B7280]" />
										</label>
									</div>
								</div>

								{/* Image Files Preview */}
								{imageFiles.length > 0 && (
									<div className="flex gap-3 flex-wrap px-3 pb-3">
										{imageFiles.map((imageFile) => (
											<ImagePreview
												key={imageFile.id}
												file={imageFile}
												handleCancel={removeFile}
												progress={progress[imageFile.name]}
												showProgress={true}
												canCancel={true}
											/>
										))}
									</div>
								)}

								{/* Non-Image Files Preview */}
								{notImageFiles.length > 0 && (
									<div className="flex gap-3 flex-wrap px-3 pb-3">
										{notImageFiles.map((file) => (
											<FilePreview
												key={file.id}
												fileName={file.name}
												handleCancel={removeFile}
												progress={progress[file.name]}
												showProgress={true}
												canCross={true}
												fileUrl={
													uploadedMetadata?.[file.id]?.url
												}
											/>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-4 shrink-0">
						<Button
							variant="outline"
							onClick={handleBulkActionsCancel}
							className="flex-1 text-[#26064ACC] border-[#E5E7EB]"
						>
							Cancel
						</Button>
						<Button
							onClick={handleBulkActionsDone}
							className="flex-1 bg-[#6A12CE] hover:bg-[#5A0EBE] text-white"
							disabled={
								(bulkAssignedUsers.length === 0 &&
									selectedFlaggingType !== 'green') ||
								!hasAnyBulkAction ||
								(files.length !== 0 && !isAllFilesUploaded) ||
								bulkUpdateMutation.isPending
							}
						>
							{bulkUpdateMutation.isPending ? 'Applying...' : 'Done'}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

export default BulkActions;
