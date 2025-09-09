import React, { useContext, useEffect, useState } from 'react';
import MultiSelect from '@/components/elements/MultiSelect';
import PDFViewer from './components/PdfViewer';
import { useQuery } from '@tanstack/react-query';
import { getDataSourceById } from '../configuration/service/configuration.service';
import { getFileIcon } from '@/lib/utils';
import { EditContext } from './components/WorkspaceEditProvider';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useRouter } from '@/hooks/useRouter';
import { logError } from '@/lib/logger';
import useDatasourceDetails from '@/api/datasource/hooks/useDataSourceDetails';

const ExcelFileContent = ({
	file,
	selectedColumns,
	handleColumnChange,
	editDisabled,
	setWorkspaceHasChanges,
	changeSets,
	setChangesets,
	setEditedFileNames,
	editedFileNames,
}) => {
	const { query } = useRouter();
	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);

	const { data: datasourceData } = useDatasourceDetails();
	return (
		<div className="flex flex-wrap gap-2 mt-4 rounded-lg py-2.5">
			<MultiSelect
				options={file?.columns?.map((column) => ({
					label: column.name,
					value: column.name,
				}))}
				defaultValue={selectedColumns[file?.id]}
				onValueChange={(newSelectedColumns) => {
					if (editDisabled) return;
					const newEditedFileNames = [...editedFileNames];
					if (!newEditedFileNames.includes(file?.filename)) {
						newEditedFileNames.push(file?.filename);
					}
					setEditedFileNames(newEditedFileNames);

					trackEvent(
						EVENTS_ENUM.REFERENCE_EDITED,
						EVENTS_REGISTRY.REFERENCE_EDITED,
						() => ({
							edited_file_names: newEditedFileNames,
							chat_session_id: query?.sessionId,
							dataset_id: datasourceData?.datasource_id,
							dataset_name: datasourceData?.name,
							query_id: chatStoreReducer?.activeQueryId,
						}),
					);
					setWorkspaceHasChanges(true);
					setChangesets({
						...changeSets,
						reference: true,
					});
					handleColumnChange(file?.id, newSelectedColumns);
				}}
				maxCount={3}
			/>
		</div>
	);
};

const PDFFileContent = ({ file, toolData, onViewPDF }) => {
	const usedPages = toolData[file.id]?.bounding_boxes
		? Object.keys(toolData[file.id].bounding_boxes).map(Number)
		: [];

	return (
		<div className="mt-4">
			<Button
				variant="outline"
				onClick={() => onViewPDF(file, usedPages)}
				className="text-sm mt-2 font-semibold text-purple-100 hover:bg-white hover:text-purple-100 hover:opacity-80 flex items-center"
			>
				View PDF
			</Button>
		</div>
	);
};

const SourceComponent = ({
	data,
	datasourceId,
	workspaceHasChanges,
	setWorkspaceHasChanges,
}) => {
	const [selectedPDF, setSelectedPDF] = useState(null);
	const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
	const [usedPages, setUsedPages] = useState([]);
	const [editedFileNames, setEditedFileNames] = useState([]);

	const {
		changeSets,
		selectedColumns,
		setSelectedColumns,
		handleColumnChange,
		setChangesets,
		editDisabled,
	} = useContext(EditContext);

	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);

	const toolData =
		data?.tool_data && typeof data?.tool_data === 'string'
			? JSON.parse(data?.tool_data)
			: data?.tool_data;

	const { data: datasourceData, isLoading } = useDatasourceDetails();

	async function fetchDatasource(datasourceId) {
		try {
			return await getDataSourceById(datasourceId);
		} catch (error) {
			console.error('Error fetching data source:', error);
			logError(error, { feature: 'chat', action: 'fetch-datasource' });
		}
	}

	const setInitialState = () => {
		const initialSelectedColumns = {};

		Object.keys(toolData || {}).forEach((fileId) => {
			initialSelectedColumns[fileId] = toolData[fileId].columns_used || [];
		});
		setSelectedColumns(initialSelectedColumns);
	};

	useEffect(() => {
		if (toolData && !Object.keys(selectedColumns).length) {
			setInitialState();
		}
	}, [toolData]);

	useEffect(() => {
		if (workspaceHasChanges) return;
		setInitialState();
	}, [chatStoreReducer?.activeQueryId]);
	const handleViewPDF = (file, pages) => {
		setSelectedPDF(file);
		setUsedPages(pages);
		setIsPDFModalOpen(true);
	};

	const renderFiles = () => {
		let contentArr = [];
		if (!datasourceData?.processed_files?.files) return;

		const sortedFiles = datasourceData?.processed_files?.files.sort((a, b) => {
			const selectedColumnsCountA = selectedColumns[a.id]?.length || 0;
			const selectedColumnsCountB = selectedColumns[b.id]?.length || 0;
			return selectedColumnsCountB - selectedColumnsCountA;
		});

		sortedFiles?.map((file) => {
			if (file?.id) {
				const content = (
					<div
						key={file?.id}
						className="mb-4 border border-purple-10 rounded-2xl p-4"
					>
						<div className="flex items-center gap-2">
							<img
								src={getFileIcon(file?.filename)}
								className="size-5"
							/>
							<h3 className="text-primary60 font-semibold">
								{file?.filename || 'File'}
							</h3>
						</div>
						{file?.type === 'pdf' ? (
							<PDFFileContent
								file={file}
								toolData={toolData}
								onViewPDF={handleViewPDF}
							/>
						) : (
							<ExcelFileContent
								file={file}
								selectedColumns={selectedColumns}
								handleColumnChange={handleColumnChange}
								editDisabled={editDisabled}
								setWorkspaceHasChanges={setWorkspaceHasChanges}
								changeSets={changeSets}
								setChangesets={setChangesets}
								setEditedFileNames={setEditedFileNames}
								editedFileNames={editedFileNames}
							/>
						)}
					</div>
				);

				contentArr.push(content);
			}
		});
		return contentArr;
	};

	return (
		<div className="rounded-2xl col-span-4 text-primary80 font-medium h-fit">
			<div className="mb-4">
				{toolData && !isLoading ? renderFiles() : null}
			</div>
			{selectedPDF && (
				<PDFViewer
					fileUrl={selectedPDF.url}
					isOpen={isPDFModalOpen}
					onClose={() => setIsPDFModalOpen(false)}
					usedPages={usedPages}
				/>
			)}
		</div>
	);
};

export default SourceComponent;
