import React, { useState, useRef, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogDescription,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { Input } from '@/components/ui/input';
import { editTemplate, saveTemplate } from '../../new-chat/service/new-chat.service';

const SaveEditTemplateModal = React.memo(
	({
		open,
		closeModal,
		label,
		queries,
		setQueries,
		refetchSavedQueries,
		templateData,
		mode,
	}) => {
		const [templateName, setTemplateName] = useState(templateData?.name || '');
		const inputRefs = useRef([]);
		const utilReducer = useSelector((state) => state.utilReducer);
		const dispatch = useDispatch();

		useEffect(() => {
			inputRefs.current = inputRefs.current.slice(0, queries?.length);
		}, [queries]);

		const isValidData = () => {
			if (templateName.trim() === '') {
				toast.error("Template name can't be empty!");
				return false;
			}

			const isEmptryQueryPresent = queries?.some(
				(query) => query?.text?.trim() === '',
			);
			if (isEmptryQueryPresent) {
				toast.error("Query can't be empty!");
				return false;
			}
			return true;
		};

		const saveTemplateMutation = useMutation({
			mutationFn: async (queries) => {
				const data = {
					name: templateName,
					type: mode,
					data: {
						queries: queries?.map((query) => {
							return {
								text: query?.text,
							};
						}),
					},
				};

				await saveTemplate(data);
			},
			onSuccess: () => {
				refetchSavedQueries();
				toast.success('Template saved Successfully');
				closeModal();
			},
			onError: (err) => {
				console.log('Error Saving Template', err);
				toast.error('Something went wrong while saving template');
			},
		});

		const updateTemplateMutation = useMutation({
			mutationFn: async ({ templateId, queries }) => {
				const data = {
					name: templateName,
					type: mode,
					data: {
						queries: queries?.map((query) => {
							return {
								text: query?.text,
							};
						}),
					},
				};

				await editTemplate(templateId, data);
			},
			onSuccess: () => {
				refetchSavedQueries();
				toast.success('Template Updated Successfully');
				closeModal();
			},
			onError: (err) => {
				console.log('Error Updating Template', err);
				toast.error('Something went wrong while updating template');
			},
		});

		const handleSave = () => {
			if (!isValidData()) {
				return;
			}

			if (templateData?.isEditing) {
				updateTemplateMutation?.mutate({
					templateId: templateData?.id,
					queries,
				});
			} else {
				saveTemplateMutation?.mutate(queries);
			}
		};

		const handleQueryChange = (id, newText) => {
			const updatedQueries = queries.map((query) =>
				query.id === id ? { ...query, text: newText } : query,
			);
			setQueries(updatedQueries);
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
						if (index < currentQueryIndex) {
							newQueries.push({ ...query });
						} else if (index === currentQueryIndex) {
							newQueries.push({ ...query });
							newQueries.push(newQuery);
						} else {
							newQueries.push({ ...query, id: query?.id + 1 });
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

				if (queries?.length > 1) {
					const updatedQueries = queries.filter(
						(query) => query.id !== id,
					);
					setQueries(updatedQueries);
					setTimeout(() => {
						inputRefs.current[updatedQueries?.length - 1].focus();
					}, 0);
				}
			}
		};

		return (
			<Dialog open={open} onOpenChange={closeModal}>
				<DialogContent className="max-w-[40%]">
					<DialogHeader className="border-b pb-3">
						<div className="flex gap-6 items-center">
							<div>
								<img
									src="https://d2vkmtgu2mxkyq.cloudfront.net/save-edit-template-dialog-icon.svg"
									alt="icon"
									className="size-14"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<DialogTitle>
									{templateData?.isEditing ? 'Edit' : 'Save'}{' '}
									{mode === 'workflow'
										? 'Workflow'
										: 'To be decided'}
								</DialogTitle>
								<DialogDescription>
									You can{' '}
									{templateData?.isEditing ? 'edit' : 'save'} your{' '}
									{mode === 'workflow'
										? 'workflow'
										: 'To be decided'}{' '}
									as a template
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="mb-2">
						<Label className="text-[#00000099]">Template Name</Label>
						<div className="border border-gray-300 p-2 mt-1 rounded text-[#00000099] font-medium">
							<input
								type="text"
								value={templateName}
								onChange={(e) => setTemplateName(e.target.value)}
								placeholder={
									templateName === 0 ? 'Type template name' : ''
								}
								className="w-full outline-none border-none"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-2 rounded-lg max-h-[40vh] w-full overflow-y-scroll">
						{queries.map((query, index) => (
							<div
								key={query.id}
								className="flex items-center p-1 bg-[#6A12CD0A] gap-1"
							>
								<label className="text-gray-500">{`${label} ${index < 9 ? '0' : ''}${index + 1}:`}</label>
								<Input
									type="text"
									onFocus={() =>
										utilReducer?.isSideNavOpen &&
										dispatch(
											updateUtilProp([
												{
													key: 'isSideNavOpen',
													value: false,
												},
											]),
										)
									}
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

					<DialogFooter className="flex w-full">
						<Button
							onClick={handleSave}
							className="rounded-lg hover:bg-purple-100 w-full hover:text-white hover:opacity-80"
							disabled={saveTemplateMutation.isPending}
						>
							{saveTemplateMutation.isPending ? (
								<i className="bi-arrow-clockwise animate-spin me-2"></i>
							) : null}
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);

export default SaveEditTemplateModal;
