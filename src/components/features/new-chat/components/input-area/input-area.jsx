import React, {
	useState,
	useRef,
	useCallback,
	useLayoutEffect,
	useMemo,
	useEffect,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { toast } from '@/lib/toast';
import { createPortal } from 'react-dom';

import SingleInputMode from './modes/single-input-mode';
import BulkInputMode from './modes/bulk-input-mode';
import WorkflowInputMode from './modes/workflow-input-mode';
import InputToolbar from './input-toolbar';
import MoreActionsModal from '../../MoreActionsModal';
import SaveEditTemplateModal from '@/components/features/reports/components/SaveEditTemplateModal';

import { useTemplates } from './hooks/use-templates';
import { usePromptEnhancer } from './hooks/use-prompt-enhancer';
import { useInputModes } from './hooks/use-input-modes';
import { useMentions } from './hooks/use-mentions';
import { useModalManagement } from './hooks/use-modal-management';
import { useInputHandlers } from './hooks/use-input-handlers';
import { pxToRem } from '@/utils/unit-convertor';
import useDatasourceDetails from '@/api/datasource/hooks/useDataSourceDetails';
import { useSessionId } from '@/hooks/use-session-id';

const InputArea = ({ config, onAppendQuery, disabled = false }) => {
	// Refs
	const firstActionRef = useRef(null);
	const singleInputRef = useRef(null);

	// Redux
	const utilReducer = useSelector((state) => state.utilReducer);
	const dispatch = useDispatch();
	const sessionId = useSessionId();

	// Custom hooks - Core functionality
	const { mode, queries, setMode, setQueries, handleQueryChange, resetQueries } =
		useInputModes();
	const [prompt, setPrompt] = useState('');

	const { data: datasourceData } = useDatasourceDetails();
	const { processedFiles } = useMemo(() => {
		const ds = datasourceData;
		return {
			processedFiles: ds?.processed_files?.files || [],
		};
	}, [datasourceData]);

	useEffect(() => {
		setPrompt('');
	}, [sessionId]);

	const {
		templates,
		templateActions,
		savedQueryReference,
		setSavedQueryReference,
		showSaveEditTemplateModal,
		setShowSaveEditTemplateModal,
		editTemplateData,
		setEditTemplateData,
		resetEditTemplateData,
	} = useTemplates();

	const { enhancePrompt, isEnhancing, showStream, disablePromptEnhancer } =
		usePromptEnhancer(prompt);

	// Custom hooks - UI and interaction
	const {
		showModal,
		setShowModal,
		secondaryModalData,
		setSecondaryModalData,
		modalPosition,
		setModalPosition,
		resetSecondaryModalData,
		handleActionSelect,
	} = useModalManagement(setMode);

	const { transformMentions, handleMentionClick } = useMentions(
		prompt,
		setPrompt,
		singleInputRef,
		mode,
	);

	const {
		handlePromptChange,
		handleSend,
		handleSwitchToSimpleMode,
		handleKeyDown,
	} = useInputHandlers({
		prompt,
		setPrompt,
		mode,
		queries,
		setMode,
		resetQueries,
		savedQueryReference,
		setShowModal,
		resetSecondaryModalData,
		singleInputRef,
		transformMentions,
		onAppendQuery,
		isEnhancing,
	});

	const handleCloseSaveEditTemplateModal = () => {
		if (editTemplateData?.isEditing) {
			resetEditTemplateData();
			resetQueries();
			setMode('single');
		}
		setShowSaveEditTemplateModal(false);
	};

	const renderInputByMode = () => {
		switch (mode) {
			case 'bulk':
				return (
					<BulkInputMode
						queries={queries}
						handleQueryChange={handleQueryChange}
						setQueries={setQueries}
						onSaveTemplate={() => setShowSaveEditTemplateModal(true)}
						disabled={disabled}
						onSwitchToSimpleMode={handleSwitchToSimpleMode}
					/>
				);
			case 'workflow':
				return (
					<WorkflowInputMode
						queries={queries}
						handleQueryChange={handleQueryChange}
						setQueries={setQueries}
						onSaveTemplate={() => setShowSaveEditTemplateModal(true)}
						disabled={disabled}
						onSwitchToSimpleMode={handleSwitchToSimpleMode}
					/>
				);
			case 'single':
			default:
				return (
					<SingleInputMode
						prompt={prompt}
						onPromptChange={handlePromptChange}
						onKeyDown={(event) => handleKeyDown(event, firstActionRef)}
						disabled={disabled || isEnhancing}
						files={processedFiles}
						filesLoading={!processedFiles?.length}
						dispatch={dispatch}
						utilReducer={utilReducer}
						updateUtilProp={updateUtilProp}
						inputRef={singleInputRef}
					/>
				);
		}
	};

	return (
		<div className="relative w-full z-50">
			{showModal && (
				<div className="absolute z-[9999] bottom-[calc(100%+0.5rem)]">
					<MoreActionsModal
						config={config}
						onSelect={handleActionSelect}
						ref={firstActionRef}
						templatesData={templates?.saved_queries}
						showSecondaryModal={secondaryModalData?.isVisible}
						secondaryModalId={secondaryModalData?.id}
						handleDeleteTemplate={templateActions.handleDelete}
						handleEditTemplate={templateActions.handleEdit}
						handleTemplateSelect={(templateId) => {
							try {
								const result =
									templateActions.handleSelect(templateId);
								if (result) {
									setMode(result.mode);
									setQueries(result.queries);
									setSecondaryModalData((prev) => ({
										...prev,
										isVisible: false,
									}));
									setShowModal(false);
								}
							} catch (error) {
								console.error('Error selecting template:', error);
								toast.error(
									'Failed to load template. Please try again.',
								);
							}
						}}
					/>
				</div>
			)}

			<div className="w-full rounded-xl flex flex-col justify-between bg-purple-4 px-3 py-2 mb-2">
				{renderInputByMode()}

				<InputToolbar
					disabled={disabled}
					filesLoading={!processedFiles?.length}
					isEnhancing={isEnhancing}
					showStream={showStream}
					disablePromptEnhancer={disablePromptEnhancer}
					onEnhancePrompt={() => {
						try {
							enhancePrompt(prompt, setPrompt);
						} catch (error) {
							console.error('Error enhancing prompt:', error);
							toast.error(
								'Failed to enhance prompt. Please try again.',
							);
						}
					}}
					onSend={handleSend}
					mode={mode}
					promptLength={prompt?.trim()?.length || 0}
					onMentionClick={handleMentionClick} // Add this line to pass the handler
				/>
			</div>

			{showSaveEditTemplateModal &&
				createPortal(
					<SaveEditTemplateModal
						open={showSaveEditTemplateModal}
						closeModal={handleCloseSaveEditTemplateModal}
						templateData={editTemplateData}
						queries={queries}
						setQueries={setQueries}
						label={mode === 'workflow' ? 'Step' : 'Query'}
						refetchSavedQueries={templateActions.refetch}
						mode={mode}
					/>,
					document.body,
				)}
		</div>
	);
};

export default InputArea;
