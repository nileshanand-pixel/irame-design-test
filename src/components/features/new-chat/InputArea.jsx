import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import CHAT_CONSTANTS from '@/constants/chat.constant';
import MoreActionsModal from './MoreActionsModal';
import { chatCommandInitiator, getToken } from '@/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { Button } from '@/components/ui/button';
import SaveEditTemplateModal from '../reports/components/SaveEditTemplateModal';
import { useMutation, useQuery } from '@tanstack/react-query';
import { deleteTemplate, getTemplates } from './service/new-chat.service';

const InputArea = ({ config, onAppendQuery, disabled=false}) => {
	const [prompt, setPrompt] = useState('');
	const [showModal, setShowModal] = useState(false);
	const [mode, setMode] = useState('single');
	const [queries, setQueries] = useState([{ id: 1, text: '' }]);
	const [showSaveEditTemplateModal, setShowSaveEditTemplateModal] = useState(false);
	const [isEditingTemplate, setIsEditingTemplate] = useState(false);
	const [templateName, setTemplateName] = useState("");
	const [templateId, setTemplateId] = useState("");
	const [showSecondaryModal, setShowSecondaryModal] = useState(false);
	const [secondaryModalId, setSecondaryModalId] = useState("");
	const utilReducer = useSelector((state) => state.utilReducer);
	const dispatch = useDispatch();

	const inputRefs = useRef([]);
	const simpleInputRef = useRef(null);
	const firstActionRef = useRef(null);

	const {
		data: savedQueriesData,
		isLoading: isLoadingSavedQueries,
		error: errorInFetchingSavedQueries,
		refetch: refetchSavedQueries,
	} = useQuery({
		queryKey: 'saved-queries',
		queryFn: () => getTemplates(getToken()),
		enabled: !!config?.savedQueries,
	});

	const deleteSavedQueryMutation = useMutation({
        mutationFn: async (queryId) => {
            await deleteTemplate(queryId, getToken());
        },
        onSuccess: () => {
			refetchSavedQueries();
			toast.success('Template deleted Successfully');
            closeModal();
		},
		onError: (err) => {
			console.log('Error deleting Template', err);
			toast.error('Something went wrong while deleting template');
		},
    });

	// Effect to manage inputRefs cleanup and focus
	useEffect(() => {
		inputRefs.current = inputRefs.current.slice(0, queries.length);
	}, [queries]);

	const handlePromptChange = (e) => {
		const value = e.target.value;
		setPrompt(value);
		if (!value) setShowModal(false);
		if (chatCommandInitiator(value)) {
			setShowModal(true);
		} else {
			setShowModal(false);
		}
	};

	const handleActionSelect = (actionId) => {
		switch (actionId) {
			case 'queryInBulk':
				setMode('bulk');
				break;
			case 'workflowQuery':
				setMode('workflow');
				break;
			case "savedQueries": 
				setSecondaryModalId("savedQueries-secondaryModal");
				setShowSecondaryModal((prev) => !prev);
				return;
			default:
				break;
		}
		setShowModal(false);
	};

	// Handle the input change for queries in bulk/workflow mode
	const handleQueryChange = (id, newText) => {
		const updatedQueries = queries.map((query) =>
			query.id === id ? { ...query, text: newText } : query,
		);
		setQueries(updatedQueries);
	};

	const handleSingleKeyDown = (e) => {
		if (e.key === 'Enter') {
			if(showModal) {
				if(firstActionRef && firstActionRef?.current && firstActionRef?.current?.click) {
					firstActionRef?.current?.click();
				}
			} else {
				handleSend();
			}
		}
	};

	const handleBulkKeyDown = (e, id) => {
		const currentQueryIndex = queries.findIndex((query) => query.id === id);
		const currentQuery = queries[currentQueryIndex];

		if (e.key === 'Enter') {
			e.preventDefault();
			
			if (currentQuery.text.trim() === '') { 
				return;
			}

			const newQuery = { id: currentQuery?.id + 1, text: '' };

			setQueries((prev) => {
				const newQueries = [];

				prev?.forEach((query, index) => {
					if(index < currentQueryIndex) {
						newQueries.push({...query});
					} else if(index === currentQueryIndex) {
						newQueries.push({...query});
						newQueries.push(newQuery);
					} else {
						newQueries.push({...query, id: query?.id + 1})
					}
				})

				return [...newQueries];
			})

			setTimeout(() => {
				inputRefs.current[currentQueryIndex + 1].focus();
			}, 0)
		}

		if (
			(e.key === 'Backspace' || e.key === 'Delete') &&
			currentQuery.text.trim() === ''
		) {
			e.preventDefault();

			if (queries.length > 1) {
				const updatedQueries = queries.filter((query) => query.id !== id);
				setQueries(updatedQueries);
				setTimeout(() => {
					inputRefs.current[updatedQueries.length - 1].focus();
				}, 0);
			} else if (queries.length === 1) {
				setQueries([{ id: 1, text: '' }]);
				setMode('single');
				setPrompt('');
				setTimeout(() => {
					// Focus the single input when switching back to single mode
					if (simpleInputRef.current) {
						simpleInputRef.current.focus();
					}
				}, 0);
			}
		}
	};

	const handleSend=async()=>{
		await onAppendQuery(prompt, queries, mode);
		setPrompt('');
		setQueries([{ id: 1, text: '' }]);
		setMode("single");
	}

	const handleSaveTemplateClick = () => {	
		setShowSaveEditTemplateModal(true);
	}

	const handleDeleteSavedQuery = (queryId) => {
		if(confirm("Are you sure that you want to delete this template?")) {
			deleteSavedQueryMutation?.mutate(queryId);
		}
	}

	const handleEditSavedQuery = (queryId) => {
		const queriesToEditData = savedQueriesData?.saved_queries?.filter((data) => {
			if(data?.external_id === queryId) {
				return true;
			}
			return false;
		})?.[0];

		const queriesToEdit = queriesToEditData?.data?.queries;

		if(queriesToEdit) {
			setQueries(queriesToEdit?.map((data, index) => {
				return {
					text: data?.text,
					id: index + 1
				};
			}));
			setIsEditingTemplate(true);
			setTemplateName(queriesToEditData?.name);
			setShowSaveEditTemplateModal(true);
			setMode(queriesToEditData?.type);
			setTemplateId(queriesToEditData?.external_id);
		}
	} 

	const handleCloseSaveEditTemplateModal = () => {
		if(isEditingTemplate) {
			setIsEditingTemplate(false);
			setMode("single");
		}

		setShowSaveEditTemplateModal(false)
	}

	const handleSelectQuery = (queryId) => {
		const currentQueries = savedQueriesData?.saved_queries?.filter((data) => {
			if(data?.external_id === queryId) {
				setMode(data?.type);
				setQueries(data?.data?.queries?.map((query, queryIndex) => {
					return {
						text: query?.text,
						id: queryIndex + 1,
					};
				}));
				setShowSecondaryModal(false);
				setShowModal(false);
			}
		})
	}

	const renderBulkMode = (label) => (
		<div className="w-[90%] flex flex-col gap-2 pr-2">
			{showSaveEditTemplateModal && (
				<SaveEditTemplateModal
					open={showSaveEditTemplateModal}
					closeModal={handleCloseSaveEditTemplateModal}
					isEditingTemplate={isEditingTemplate}
					queries={queries}
					setQueries={setQueries}
					label={label}
					name={templateName}
					refetchSavedQueries={refetchSavedQueries}
					templateId={templateId}
				/>
			)}
			<div className="flex flex-col gap-2 rounded-lg max-h-40 w-full overflow-y-scroll">
				{queries.map((query, index) => (
					<div
						key={query.id}
						className="flex items-center p-1 bg-[#6A12CD0A] gap-1"
					>
						<label className="text-gray-500">{`${label} ${index < 9 ? '0' : ''}${index + 1}:`}</label>
						<Input
							type="text"
							onFocus={() => utilReducer?.isSideNavOpen && dispatch(updateUtilProp([{key: 'isSideNavOpen', value: false}]))}
							className="outline-none rounded-none bg-transparent border-none px-2 py-1 flex-1"
							value={query.text}
							onChange={(e) =>
								handleQueryChange(query.id, e.target.value)
							}
							onKeyDown={(e) => handleBulkKeyDown(e, query.id)}
							placeholder={`Enter your ${label.toLowerCase()} here...`}
							ref={(el) => (inputRefs.current[index] = el)}
							autoFocus={index === queries.length - 1}
						/>
					</div>
				))}
			</div>
			<div className="flex justify-between items-center">
				<p className="text-sm flex items-baseline text-gray-500">
					Press Enter &#8617; to add another {label.toLowerCase()}
				</p>
				<Button
					variant="secondary"
					className="w-fit bg-transparent rounded-lg text-sm font-normal text-purple border-2 border-[#26064A1A]"
					onClick={handleSaveTemplateClick}
				>
					Save as template
				</Button>
			</div>
		</div>
	);

	const renderSimpleMode = () => (
		<Input
			placeholder={CHAT_CONSTANTS.IRA_INPUT_PLACEHOLDER}
			onFocus={() => utilReducer?.isSideNavOpen && dispatch(updateUtilProp([{key: 'isSideNavOpen', value: false}]))}
			className="border-0 outline-none rounded-none bg-transparent w-full mr-2"
			value={prompt}
			onChange={handlePromptChange}
			onKeyDown={handleSingleKeyDown}
			disabled={disabled}
			ref={simpleInputRef}
		/>
	);

	const renderInputArea = () => {
		switch (mode) {
			case 'bulk':
				return renderBulkMode('Query');
			case 'workflow':
				return renderBulkMode('Step');
			case 'single':
			default:
				return renderSimpleMode();
		}
	};

	const inputBorder = () => {
		switch (mode) {
			case 'bulk':
			case 'workflow':
				return 'rounded-lg';
			case 'single':
				return 'rounded-[100px]';
			default:
				return 'rounded-[100px]';
		}
	};

	return (
		<div className="relative w-full">
			{showModal && (
				<MoreActionsModal 
					config={config} 
					onSelect={handleActionSelect} 
					ref={firstActionRef} 
					savedQueriesData={savedQueriesData || []}
					showSecondaryModal={showSecondaryModal}
					secondaryModalId={secondaryModalId}
					handleDeleteSavedQuery={handleDeleteSavedQuery}
					handleEditSavedQuery={handleEditSavedQuery}
					handleSelectQuery={handleSelectQuery}
				/>
			)}
			<div
				className={`w-full ${inputBorder()} flex justify-between bg-purple-4 px-3 py-2 mb-2`}
			>
				{renderInputArea()}
				{!disabled ? (
					<div
						className={`flex ${mode === 'single' && 'items-center'} gap-2 pr-3 cursor-pointer`}
						onClick={handleSend}
					>
						<img
							src={`https://d2vkmtgu2mxkyq.cloudfront.net/send.svg`}
							className="size-6"
						/>
					</div>
				) : (
					<div className="flex gap-2 items-center pr-3 cursor-not-allowed">
						<i className="bi bi-arrow-repeat animate-spin text-purple-40 text-xl"></i>
					</div>
				)}
			</div>
		</div>
	);
};

export default InputArea;
