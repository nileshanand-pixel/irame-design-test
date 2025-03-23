import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
	deleteTemplate,
	enhancePrompt,
	getTemplates,
} from './service/new-chat.service';
import CHAT_CONSTANTS from '@/constants/chat.constant';
import { chatCommandInitiator, getToken } from '@/lib/utils';
import MoreActionsModal from './MoreActionsModal';
import SaveEditTemplateModal from '../reports/components/SaveEditTemplateModal';

import { Textarea } from '@/components/ui/textarea';
import { Hint } from '@/components/Hint';
import PromptingRole from './components/PromptingRole';
import CircularLoader from '@/components/elements/loading/CircularLoader';

const autoResize = (e, prompt, maxHeight = 150) => {
	if (!prompt) return;
	e.target.style.height = 'auto';
	const newHeight = e.target.scrollHeight;
	const clampedHeight = newHeight > maxHeight ? maxHeight : newHeight;
	e.target.style.height = `${clampedHeight}px`;
};

const InputArea = ({ config, onAppendQuery, disabled = false }) => {
	const [prompt, setPrompt] = useState('');
	const [showModal, setShowModal] = useState(false);
	const [mode, setMode] = useState('single');
	const [queries, setQueries] = useState([{ id: 1, text: '' }]);
	const [savedQueryReference, setSavedQueryReference] = useState({
		id: '',
		title: '',
	});
	const [showSaveEditTemplateModal, setShowSaveEditTemplateModal] =
		useState(false);
	const [editTemplateData, setEditTemplateData] = useState({
		name: '',
		id: '',
		isEditing: false,
	});
	const [secondaryModalData, setSecondaryModalData] = useState({
		isVisible: false,
		id: '',
	});
	const [showStream, setShowStream] = useState(false);

	const utilReducer = useSelector((state) => state.utilReducer);
	const dispatch = useDispatch();

	const disablePromptEnhancer = useMemo(() => {
		return prompt?.trim().split(/\s+/).length <= 3 || showStream;
	}, [prompt, showStream]);

	const getTemplatesQuery = useQuery({
		queryKey: ['saved-queries'],
		queryFn: () => getTemplates(getToken()),
		enabled: !!config?.savedQueries,
	});

	const deleteTemplateMutation = useMutation({
		mutationFn: async (templateId) => {
			await deleteTemplate(templateId, getToken());
		},
		onSuccess: () => {
			getTemplatesQuery?.refetch();
			toast.success('Template deleted Successfully');
			handleCloseSaveEditTemplateModal();
		},
		onError: (err) => {
			console.log('Error deleting Template', err);
			toast.error('Something went wrong while deleting template');
		},
	});

	const enhancePromptMutation = useMutation({
		mutationFn: async (prompt, mode) => {
			return await enhancePrompt(prompt, mode);
		},
		onSuccess: (data) => {
			const newPrompt = data || '';
			setPrompt('');
			setShowStream(true);

			let i = 0;
			const intervalId = setInterval(() => {
				setPrompt((prevPrompt) => prevPrompt + (newPrompt[i] ?? ''));
				simpleInputRef.current.scrollTop = simpleInputRef.current.scrollHeight
				i++;
				if (i >= newPrompt.length) {
					setShowStream(false);
					clearInterval(intervalId);
				}
			}, 20);
		},
		onError: (err) => {
			toast.error(
				'Something went wrong while enhancing prompt. please try again',
			);
			console.log(err);
		},
	});

	const inputRefs = useRef([]);
	const simpleInputRef = useRef(null);
	const firstActionRef = useRef(null);

	useEffect(() => {
		inputRefs.current = inputRefs.current.slice(0, queries.length);
	}, [queries]);

	const resetSecondaryModalData = () => {
		setSecondaryModalData({
			id: '',
			isVisible: false,
		});
	};

	const resetQueries = () => {
		setQueries([{ id: 1, text: '' }]);
	};

	const resetEditTemplateData = () => {
		setEditTemplateData({
			id: '',
			isEditing: false,
			name: '',
		});
	};

	const handlePromptChange = (e) => {
		const value = e.target.value;
		setPrompt(value);

		if (!value) {
			setShowModal(false);
			resetSecondaryModalData();
		}
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
			case 'savedQueries':
				setSecondaryModalData((prev) => {
					return {
						...prev,
						id: 'savedQueries-secondaryModal',
						isVisible: !prev.isVisible,
					};
				});
				return;
			default:
				break;
		}
		setShowModal(false);
		resetSecondaryModalData();
	};

	const handleQueryChange = (id, newText) => {
		const updatedQueries = queries.map((query) =>
			query.id === id ? { ...query, text: newText } : query,
		);
		setQueries(updatedQueries);
	};

	const handleSingleKeyDown = (event) => {
		if (enhancePromptMutation.isLoading) {
			return;
		}

		if (event.keyCode === 13 && !event.shiftKey && !event.ctrlKey) {
			if (showModal) {
				if (firstActionRef?.current?.click) {
					firstActionRef.current.click();
				}
			}
		} else if (event.ctrlKey && event.keyCode === 13) {
			event.preventDefault();
			handleSend();
		}
	};

	const handleBulkKeyDown = (e, id) => {
		const currentQueryIndex = queries.findIndex((query) => query.id === id);
		const currentQuery = queries[currentQueryIndex];

		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();

			if (currentQuery.text.trim() === '') {
				return;
			}

			const newQuery = { id: currentQuery.id + 1, text: '' };

			setQueries((prev) => {
				const newQueries = [];
				prev.forEach((q, index) => {
					if (index < currentQueryIndex) {
						newQueries.push({ ...q });
					} else if (index === currentQueryIndex) {
						newQueries.push({ ...q });
						newQueries.push(newQuery);
					} else {
						newQueries.push({ ...q, id: q.id + 1 });
					}
				});
				return [...newQueries];
			});

			setTimeout(() => {
				inputRefs.current[currentQueryIndex + 1].focus();
			}, 0);
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
					if (simpleInputRef.current) {
						simpleInputRef.current.focus();
					}
				}, 0);
			}
		}
	};

	const handleSend = async () => {
		if (enhancePromptMutation.isLoading && mode === 'single') {
			return;
		}
		await onAppendQuery(prompt, queries, savedQueryReference, mode);
		setPrompt(null); // Force unmount & remount
		setTimeout(() => setPrompt(''), 0); // Restore after re-render
		setQueries([{ id: 1, text: '' }]);
		setMode('single');
	};

	const handleSaveTemplateClick = () => {
		setShowSaveEditTemplateModal(true);
	};

	const handleDeleteTemplate = (templateId) => {
		if (confirm('Are you sure that you want to delete this template?')) {
			deleteTemplateMutation.mutate(templateId);
		}
	};

	const handleEditTemplate = (templateId) => {
		const queriesToEditData = getTemplatesQuery?.data?.saved_queries?.filter(
			(data) => {
				if (data?.external_id === templateId) {
					return true;
				}
				return false;
			},
		)?.[0];

		const queriesToEdit = queriesToEditData?.data?.queries;

		if (queriesToEdit) {
			setQueries(
				queriesToEdit.map((data, index) => {
					return {
						text: data?.text,
						id: index + 1,
					};
				}),
			);
			setEditTemplateData((prev) => {
				return {
					...prev,
					isEditing: true,
					name: queriesToEditData?.name,
					id: queriesToEditData?.external_id,
				};
			});
			setShowSaveEditTemplateModal(true);
			setMode(queriesToEditData?.type);
		}
	};

	const handleCloseSaveEditTemplateModal = () => {
		if (editTemplateData?.isEditing) {
			resetEditTemplateData();
			resetQueries();
			setMode('single');
		}
		setShowSaveEditTemplateModal(false);
	};

	const handleTemplateSelect = (templateId) => {
		getTemplatesQuery?.data?.saved_queries?.forEach((data) => {
			if (data?.external_id === templateId) {
				setSavedQueryReference({ id: templateId, title: data.name });
				setMode(data?.type);
				setQueries(
					data?.data?.queries?.map((query, queryIndex) => {
						return {
							text: query?.text,
							id: queryIndex + 1,
						};
					}),
				);
				setSecondaryModalData((prev) => {
					return {
						...prev,
						isVisible: false,
					};
				});
				setShowModal(false);
			}
		});
	};

	const handleEnhancePrompt = () => {
		if (disablePromptEnhancer) return;
		setPrompt('Enhancing prompt...')
		enhancePromptMutation.mutate(prompt);
	};

	const renderBulkMode = (label) => (
		<div className="w-[90%] flex flex-col gap-2 pr-2">
			{showSaveEditTemplateModal && (
				<SaveEditTemplateModal
					open={showSaveEditTemplateModal}
					closeModal={handleCloseSaveEditTemplateModal}
					templateData={editTemplateData}
					queries={queries}
					setQueries={setQueries}
					label={label}
					refetchSavedQueries={getTemplatesQuery?.refetch}
					mode={mode}
				/>
			)}
			<div className="flex flex-col gap-2 rounded-lg max-h-48 w-full overflow-y-auto">
				{queries.map((query, index) => (
					<div
						key={query.id}
						className="flex items-start p-1 bg-[#6A12CD0A] gap-1"
					>
						<label className="text-gray-500 mr-1">
							{`${label} ${index < 9 ? '0' : ''}${index + 1}:`}
						</label>
						<Textarea
							rows={1}
							onFocus={() =>
								utilReducer?.isSideNavOpen &&
								dispatch(
									updateUtilProp([
										{ key: 'isSideNavOpen', value: false },
									]),
								)
							}
							className="outline-none text-xs xl:text-sm 2xl:text-base rounded-xl bg-transparent border-none px-2 py-1 flex-1 resize-none overflow-y-auto max-h-32"
							value={query.text}
							onChange={(e) =>
								handleQueryChange(query.id, e.target.value)
							}
							onKeyDown={(e) => handleBulkKeyDown(e, query.id)}
							onInput={(e) => autoResize(e, prompt, 128)}
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
		<Textarea
			rows={1}
			placeholder={CHAT_CONSTANTS.IRA_INPUT_PLACEHOLDER}
			onFocus={() =>
				utilReducer?.isSideNavOpen &&
				dispatch(updateUtilProp([{ key: 'isSideNavOpen', value: false }]))
			}
			className="border-0 text-xs xl:text-sm 2xl:text-base outline-none rounded-xl bg-transparent w-full pr-6 resize-none overflow-y-auto show-scrollbar max-h-32"
			value={prompt || ''}
			onChange={handlePromptChange}
			onInput={(e) => autoResize(e, prompt, prompt ? 300 : 50)}
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

	return (
		<div className="relative w-full z-50">
			{showModal && (
				<MoreActionsModal
					config={config}
					onSelect={handleActionSelect}
					ref={firstActionRef}
					templatesData={getTemplatesQuery?.data || []}
					showSecondaryModal={secondaryModalData?.isVisible}
					secondaryModalId={secondaryModalData?.id}
					handleDeleteTemplate={handleDeleteTemplate}
					handleEditTemplate={handleEditTemplate}
					handleTemplateSelect={handleTemplateSelect}
				/>
			)}
			<div className="w-full rounded-xl flex flex-col justify-between bg-purple-4 px-3 py-2 mb-2">
				{renderInputArea()}
				{!disabled ? (
					<div className="flex justify-between">
						<div className="flex px-2 items-center">
							{enhancePromptMutation.isPending ? (
								<div className="text-xs flex gap-1 items-center text-purple-80">
									<CircularLoader size="sm" />
									Enhancing Prompt
								</div>
							) : (
								<>
									<Hint label="Enhance Prompt">
										<Button
											onClick={handleEnhancePrompt}
											variant="transparent"
											size="iconSm"
											className={`${
												disablePromptEnhancer &&
												'cursor-not-allowed opacity-40'
											}`}
											disabled={disablePromptEnhancer}
										>
											<img
												src="https://d2vkmtgu2mxkyq.cloudfront.net/generate_ai.svg"
												className="size-6"
												style={{ strokeWidth: '2' }}
												alt="enhance icon"
											/>
										</Button>
									</Hint>
								</>
							)}
							{!disablePromptEnhancer && <PromptingRole />}
						</div>

						{(!enhancePromptMutation.isPending && !showStream) && (
							<div className="flex gap-4 items-center justify-between">
								{mode === 'single' && prompt?.trim()?.length > 0 && (
									<span className="text-muted-foreground text-xs ">
										Use Control + Enter to send{' '}
									</span>
								)}
								<div
									className="flex items-end gap-2 cursor-pointer"
									
									onClick={handleSend}
								>
									<img
										src="https://d2vkmtgu2mxkyq.cloudfront.net/send.svg"
										alt="Send"
										className="size-6"
									/>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex gap-2 items-end ml-auto  cursor-not-allowed">
						<i className="bi bi-arrow-repeat animate-spin text-purple-40 text-xl"></i>
					</div>
				)}
			</div>
		</div>
	);
};

export default InputArea;
