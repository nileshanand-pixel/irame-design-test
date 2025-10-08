import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { intent as intentMap } from '../configuration.content';
import { getFileMetadata } from '@/lib/file';
import { logError } from '@/lib/logger';
import { getPdfPageCount } from '@/lib/utils';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import AutoGrowingTextarea from '@/components/elements/auto-growing-textarea';
import FileDisplay from './fileDisplay';

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
	const [fileSizes, setFileSizes] = useState({});

	const [pageCounts, setPageCounts] = useState({});

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
	}, []);

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
				{form?.files?.map((file, fileIndex) => (
					<FileDisplay
						key={fileIndex}
						file={file}
						calculateFileUrl={calculateFileUrl}
						form={form}
						setForm={setForm}
						data={data}
						addChangeForTracking={addChangeForTracking}
						isEditing={isEditing}
						fileSizes={fileSizes}
					/>
				))}
			</div>
		</div>
	);
};

export default DataCard;
