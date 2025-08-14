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
import { getPdfPageCount } from '@/lib/utils';
import { getFileMeta } from '@/lib/file';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import useS3File from '@/hooks/useS3File';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { toast } from '@/lib/toast';

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
		const response = await getFileMeta(url);
		return response.size || 0;
	} catch (error) {
		console.error('Error fetching file size:', error);
		return 0;
	}
};

const DataCard = ({ data, form, setForm, addChangeForTracking }) => {
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [description, setDescription] = useState(
		form?.processed_files?.description,
	);
	const [originalDescription, setOriginalDescription] = useState(description);
	const [activeAccordion, setActiveAccordion] = useState(
		form?.processed_files?.files[0]?.id,
	);
	const [fileSizes, setFileSizes] = useState({});
	const editRef = useRef(null);
	const handle = useFullScreenHandle();

	const [pageCounts, setPageCounts] = useState({});
	const { isDownloading, downloadS3File } = useS3File();

	useEffect(() => {
		// Fetch file sizes and page counts when component mounts
		const fetchFileData = async () => {
			const sizes = {};
			const pages = {};

			for (const file of form?.processed_files?.files || []) {
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
	}, [form?.processed_files?.files]);

	const handleDescriptionEdit = () => {
		if (description) {
			trackEvent(
				EVENTS_ENUM.DATASET_EDIT_DESCRIPTION_CLICKED,
				EVENTS_REGISTRY.DATASET_EDIT_DESCRIPTION_CLICKED,
				() => ({
					dataset_id: data?.datasource_id,
					dataset_name: data?.name,
				}),
			);
		}
		setIsEditingDescription(true);
		setOriginalDescription(description);
	};

	const handleDescriptionSave = () => {
		setIsEditingDescription(false);
		const updatedDescription = editRef.current.innerText;
		trackEvent(
			EVENTS_ENUM.DATASET_DESCRIPTION_UPDATED,
			EVENTS_REGISTRY.DATASET_DESCRIPTION_UPDATED,
			() => ({
				dataset_id: data?.datasource_id,
				dataset_name: data?.name,
				old_desc: description,
				new_desc: updatedDescription,
			}),
		);
		addChangeForTracking('description');
		setDescription(updatedDescription);
		setForm({
			...form,
			hasChanges: true,
			processed_files: {
				...form.processed_files,
				description: updatedDescription,
			},
		});
	};

	const handleCancel = () => {
		setIsEditingDescription(false);
		setDescription(originalDescription);
	};

	const handleFullScreen = (e, file) => {
		if (e) e.stopPropagation();
		trackEvent(
			EVENTS_ENUM.DATASET_FILE_ZOOM_CLICKED,
			EVENTS_REGISTRY.DATASET_FILE_ZOOM_CLICKED,
			() => ({
				dataset_id: data?.datasource_id,
				dataset_name: data?.name,
				file_name: file?.filename,
			}),
		);
		handle.active ? handle.exit() : handle.enter();
	};

	const handleDownloadFile = (e, file) => {
		if (e) e.stopPropagation();
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
		const downloadName =
			file.filename === file.worksheet || !file.worksheet
				? file.filename
				: `${file.filename}(${file.worksheet}).csv`;

		if (fileUrl) {
			downloadS3File(fileUrl, downloadName);
			toast.success('Your file has been added to download!');
		}
	};

	const calculateFileUrl = (file) => {
		const { worksheet, filename, metadata, sample_url, url, type } = file;
		if (type === 'excel' && worksheet && metadata?.files?.[`${worksheet}.csv`]) {
			return metadata.files[`${worksheet}.csv`].url;
		} else if (type === 'csv' && filename && metadata?.files?.[filename]) {
			return metadata.files[filename].url;
		} else if (type === 'pdf' || sample_url) {
			return sample_url;
		} else {
			return url;
		}
	};

	return (
		<div className={`col-span-4 h-full overflow-y-auto text-primary80`}>
			<div className="font-medium w-full flex flex-col gap-2">
				<div className="text-xl font-semibold">About Dataset</div>
				{isEditingDescription ? (
					<div>
						<div
							ref={editRef}
							contentEditable
							autoFocus
							className="border-none bg-transparent"
							style={{ whiteSpace: 'pre-wrap' }}
						>
							{description}
						</div>
						<div className="mt-4 flex gap-4">
							<Button
								variant="outline"
								onClick={handleCancel}
								className="text-sm font-semibold text-purple-100 bg-purple-4 border-none hover:text-purple-100 hover:opacity-80 flex items-center"
							>
								Cancel
							</Button>
							<Button
								onClick={handleDescriptionSave}
								className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
							>
								Save
							</Button>
						</div>
					</div>
				) : (
					<div>
						<p className="whitespace-pre-wrap">
							{description ||
								'No Description Added, Please Add description'}
						</p>
						<Button
							variant="outline"
							onClick={handleDescriptionEdit}
							className="text-sm mt-4 font-semibold text-purple-100 bg-purple-4 border-none hover:text-purple-100 hover:opacity-80 flex items-center"
						>
							{description ? 'Edit Description' : 'Add Description'}
						</Button>
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

			<Accordion
				type="single"
				className="border-none"
				value={activeAccordion}
				onValueChange={setActiveAccordion}
				collapsible
			>
				{form?.processed_files?.files.map((file, fileIndex) => (
					<AccordionItem key={file?.id} value={file?.id}>
						<AccordionTrigger className="bg-purple-4 rounded-lg py-2 pl-4 pr-2 mt-2 border-none no-underline flex justify-between items-center">
							<div className="flex w-full mr-5 justify-between">
								<div className="flex gap-6">
									<div>
										{/* Display filename and size */}
										{file.filename === file.worksheet ||
										!file.worksheet
											? file.filename
											: `${file.filename} (${file.worksheet})`}
										<span className="ml-2 text-primary60 font-normal">
											(
											{formatFileSize(fileSizes[file.id] || 0)}
											)
										</span>
									</div>
								</div>
								<div className="flex gap-6 font-medium items-center">
									{/* Show page count for PDFs or column count otherwise */}
									<span>
										{file.type === 'pdf'
											? `${pageCounts[file.id] || 'Loading...'} Pages`
											: `${file?.columns?.length || 0} Columns`}
									</span>
									<i
										onClick={
											activeAccordion === file.id
												? (e) => handleFullScreen(e, file)
												: null
										}
										className={`bi bi-fullscreen text-lg !font-bold cursor-pointer ${
											activeAccordion === file.id
												? ''
												: 'text-gray-400 cursor-not-allowed'
										}`}
									></i>
									{isDownloading ? (
										<CircularLoader className="size-[1.125rem]" />
									) : (
										<i
											onClick={(e) =>
												handleDownloadFile(e, file)
											}
											className="bi bi-download text-lg font-bold cursor-pointer"
										></i>
									)}
								</div>
							</div>
						</AccordionTrigger>

						<AccordionContent>
							<FullScreen handle={handle}>
								<div
									className={`overflow-x-scroll mt-4 w-full ${handle.active ? 'p-4 overflow-y-auto h-screen' : 'h-full'}`}
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
											addChangeForTracking={
												addChangeForTracking
											}
										/>
									)}
								</div>
							</FullScreen>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
};

export default DataCard;
