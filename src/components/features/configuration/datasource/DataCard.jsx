import React, { useState, useRef, useEffect } from 'react';
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { intent as intentMap } from '../configuration.content';
import PreviewTable from './PreviewTable';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import PreviewPdf from './PreviewPdf';
import { getFileMetadata } from '@/lib/file';
import { logError } from '@/lib/logger';
import { getFileIcon, getPdfPageCount } from '@/lib/utils';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import useS3File from '@/hooks/useS3File';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { toast } from '@/lib/toast';
import { DownloadSimple } from '@phosphor-icons/react';
import AutoGrowingTextarea from '@/components/elements/auto-growing-textarea';

const formatFileSize = (sizeInBytes) => {
	if (sizeInBytes < 1024) return `${sizeInBytes} B`;
	else if (sizeInBytes < 1048576) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
	else if (sizeInBytes < 1073741824)
		return `${(sizeInBytes / 1048576).toFixed(1)} MB`;
	else return `${(sizeInBytes / 1073741824).toFixed(1)} GB`;
};

// Function to get file size from S3 URL
const getFileSize = async (url) => {
	try {
		const response = await getFileMetadata(url);
		return response.size || 0;
	} catch (error) {
		logError(error, {
			feature: 'configuration',
			action: 'datacard-get-file-size',
		});
		return 0;
	}
};

const DataCard = ({ data, form, setForm, addChangeForTracking, isEditing }) => {
	const [isAddingDescription, setIsAddingDescription] = useState(false);
	const [activeAccordion, setActiveAccordion] = useState(form?.files?.[0]?.id);
	const [fileSizes, setFileSizes] = useState({});
	const editRef = useRef(null);
	// const handle = useFullScreenHandle();

	const [pageCounts, setPageCounts] = useState({});
	const { isDownloading, downloadS3File } = useS3File();

	useEffect(() => {
		// Fetch file sizes and page counts when component mounts
		const fetchFileData = async () => {
			const sizes = {};
			const pages = {};

			for (const file of form?.files || []) {
				const fileUrl = calculateFileUrl(file);
				sizes[file.id] = await getFileSize(fileUrl);

				if (file.type === 'pdf') {
					pages[file.id] = await getPdfPageCount(fileUrl);
				}
			}

			setFileSizes(sizes);
			setPageCounts(pages);
		};

		fetchFileData();
	}, [form?.files]);

	// const handleFullScreen = (e, file) => {
	// 	if (e) e.stopPropagation();
	// 	trackEvent(
	// 		EVENTS_ENUM.DATASET_FILE_ZOOM_CLICKED,
	// 		EVENTS_REGISTRY.DATASET_FILE_ZOOM_CLICKED,
	// 		() => ({
	// 			dataset_id: data?.datasource_id,
	// 			dataset_name: data?.name,
	// 			file_name: file?.filename,
	// 		}),
	// 	);
	// 	handle.active ? handle.exit() : handle.enter();
	// };

	const handleDownloadFile = (file) => {
		// if (e) e.stopPropagation();
		if (isDownloading) return;

		trackEvent(
			EVENTS_ENUM.DATASET_FILE_DOWNLOADED,
			EVENTS_REGISTRY.DATASET_FILE_DOWNLOADED,
			() => ({
				dataset_id: data?.datasource_id,
				dataset_name: data?.name,
				file_name: file?.filename,
			}),
		);

		const fileUrl = calculateFileUrl(file);
		const downloadName = file.filename;

		if (fileUrl) {
			downloadS3File(fileUrl, downloadName);
			toast.success('Your file has been added to download!');
		}
	};

	const calculateFileUrl = (file) => {
		const { url, processed_url } = file;
		return processed_url || url;
	};

	const handleDescriptionChange = (newValue) => {
		trackEvent(
			EVENTS_ENUM.DATASET_DESCRIPTION_UPDATED,
			EVENTS_REGISTRY.DATASET_DESCRIPTION_UPDATED,
			() => ({
				dataset_id: data?.datasource_id,
				dataset_name: data?.name,
				old_desc: form?.description,
				new_desc: newValue,
			}),
		);
		addChangeForTracking('description');
		setForm({
			...form,
			hasChanges: true,
			description: newValue,
		});
	};

	const handleAddDescriptionClick = () => {
		setIsAddingDescription(true);
	};

	return (
		<div className={`col-span-4 h-full overflow-y-auto text-primary80`}>
			<div className="font-medium w-full flex flex-col gap-2">
				<div className="text-sm text-[#26064ACC] font-semibold">
					About Dataset
				</div>
				{isEditing || isAddingDescription ? (
					<div>
						<AutoGrowingTextarea
							className="resize-none"
							value={form?.description}
							setValue={handleDescriptionChange}
							onBlur={() => setIsAddingDescription(false)}
						/>
					</div>
				) : (
					<div>
						<p className="whitespace-pre-wrap text-[#26064A99] text-sm">
							{form?.description ||
								'No Description Added, Please Add description'}
						</p>
						{!form?.description && (
							<Button
								variant="outline"
								onClick={handleAddDescriptionClick}
								className="text-sm mt-4 font-semibold text-purple-100 bg-purple-4 border-none hover:text-purple-100 hover:opacity-80 flex items-center"
							>
								Add Description
							</Button>
						)}
					</div>
				)}
			</div>

			<div className="my-4">
				<div className="text-xl font-semibold">Chosen Analysis Type</div>
				<div className="flex flex-wrap gap-2 mt-2">
					{Array.isArray(data?.intent) &&
						data?.intent?.map((useCase, index) => (
							<span
								key={useCase}
								className="text-sm font-normal px-3 py-1.5 rounded-[30px] cursor-default hover:bg-purple-8 bg-purple-8 text-purple-100 border-[0.075rem] border-primary"
							>
								{
									intentMap.find((item) => item.value === useCase)
										.label
								}
							</span>
						))}
				</div>
			</div>

			<div className="flex flex-col gap-3">
				{/* <Accordion> */}
				{form?.files?.map((file, fileIndex) => (
					<div
						className="px-4 py-3 border border-[#EAECF0] rounded-xl"
						key={fileIndex}
					>
						{/* <AccordionItem key={file?.id} value={file?.id}> */}
						{/* <AccordionTrigger> */}
						<div className="flex gap-3">
							<img
								src={getFileIcon(file.filename)}
								className="size-8"
							/>

							<div className="flex flex-col">
								<span className="text-sm font-medium">
									{file.filename}
								</span>
								<div className="text-[#6B7280] text-xs">
									<span>
										{formatFileSize(fileSizes[file.id] || 0)}
									</span>
								</div>
							</div>

							<Button
								variant="outline"
								className="p-2"
								onClick={() => {
									handleDownloadFile(file);
								}}
							>
								{isDownloading ? (
									<CircularLoader className="size-[1.125rem]" />
								) : (
									<DownloadSimple className="size-5" />
								)}
							</Button>
						</div>
						{/* </AccordionTrigger> */}

						{/* <AccordionContent> */}
						<div
							className={`overflow-x-scroll w-full h-full`}
							style={{
								backgroundColor: 'white',
							}}
						>
							{file.type === 'pdf' ? (
								<PreviewPdf url={calculateFileUrl(file)} />
							) : (
								<PreviewTable
									form={form}
									setForm={setForm}
									data={file}
									datasetData={data}
									addChangeForTracking={addChangeForTracking}
									isEditing={isEditing}
								/>
							)}
						</div>
						{/* </AccordionContent> */}
						{/* </AccordionItem> */}
					</div>
				))}
			</div>
		</div>
	);
};

export default DataCard;
