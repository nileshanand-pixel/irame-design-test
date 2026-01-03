import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import pencilIcon from '@/assets/icons/pencil.svg';
import trashIcon from '@/assets/icons/trash.svg';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from '@/lib/toast';

export default function OutputColumns({ data, addClarificationQuery, canClarify }) {
	const toolData = data?.tool_data;
	const is_clarified = data?.is_clarified;
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [columns, setColumns] = useState(() => {
		const userCols = toolData?.user?.columns;
		const iraCols = toolData?.ira?.columns;

		if (Array.isArray(userCols) && userCols.length > 0) return [...userCols];
		if (Array.isArray(iraCols) && iraCols.length > 0) return [...iraCols];
		return [];
	});

	useEffect(() => {
		const userCols = toolData?.user?.columns;
		const iraCols = toolData?.ira?.columns;

		if (Array.isArray(userCols) && userCols.length > 0)
			setColumns([...userCols]);
		else if (Array.isArray(iraCols) && iraCols.length > 0)
			setColumns([...iraCols]);
		else setColumns([]);
	}, [toolData?.user?.columns, toolData?.ira?.columns]);

	const [editingColumnInfo, setEditingColumnInfo] = useState({
		index: null,
		field: null,
	});

	// A ref that always holds the latest editingColumnInfo to check against
	const editingInfoRef = useRef(editingColumnInfo);

	useEffect(() => {
		editingInfoRef.current = editingColumnInfo;
	}, [editingColumnInfo]);

	// Clear the inputRef when there's no active editing so stale elements
	// aren't accidentally focused later.
	useEffect(() => {
		if (editingColumnInfo.index === null) {
			inputRef.current = null;
		}
	}, [editingColumnInfo.index]);

	const [cellErrors, setCellErrors] = useState({});

	// Ref to hold focus timeout id so we can clear it on unmount or before setting a new one
	const focusTimeoutRef = useRef(null);

	const handleAddColumn = () => {
		const newColumn = {
			name: '',
			description: '',
		};
		setColumns((prev) => [...prev, newColumn]);
		setEditingColumnInfo({ index: columns.length, field: 'name' });
	};

	const handleDeleteColumn = (index) => {
		setColumns(columns.filter((_, currentIndex) => index !== currentIndex));
	};

	const handleEditCell = (index, field) => {
		if (is_clarified || isSubmitting) return;
		setEditingColumnInfo({ index, field });
		// Clear error when user starts editing
		setCellErrors((prev) => {
			const newErrors = { ...prev };
			delete newErrors[`${index}-${field}`];
			return newErrors;
		});
	};

	const handleBlur = (index, field, value) => {
		// Validate column name field
		if (field === 'name' && !value.trim()) {
			setCellErrors((prev) => ({
				...prev,
				[`${index}-${field}`]: 'Column name cannot be empty',
			}));
			// Ensure the input regains focus so the user can type immediately
			// Only focus if we're still editing the same cell/field
			if (
				inputRef.current &&
				editingInfoRef.current.index === index &&
				editingInfoRef.current.field === field
			) {
				inputRef.current.focus();
			}
			return; // Don't close editing or move to next field
		}

		// If name field is valid and we're leaving it, auto-focus description
		// ONLY auto-open when description is currently empty
		if (field === 'name' && value.trim()) {
			const desc = (columns[index]?.description || '').trim();
			if (desc.length === 0) {
				// add a small delay so the UI change feels less abrupt
				if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
				// capture the intended index/field and only set focus if
				// the editing state hasn't changed in the meantime
				const scheduledIndex = index;
				const scheduledFromField = field;
				focusTimeoutRef.current = setTimeout(() => {
					// only open description if the user hasn't started editing something else
					if (
						editingInfoRef.current.index === scheduledIndex &&
						editingInfoRef.current.field === scheduledFromField
					) {
						setEditingColumnInfo({
							index: scheduledIndex,
							field: 'description',
						});
					}
					focusTimeoutRef.current = null;
				}, 200);
				return;
			}
		}

		// For description field or valid transitions, close editing
		setEditingColumnInfo({ index: null, field: null });
	};

	// cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
		};
	}, []);

	// Ref to the currently editing input element so we can programmatically focus it
	const inputRef = useRef(null);

	const handleDragEnd = (result) => {
		if (!result.destination || is_clarified || isSubmitting) {
			return;
		}

		const items = Array.from(columns);
		const [reorderedItem] = items.splice(result.source.index, 1);
		items.splice(result.destination.index, 0, reorderedItem);

		setColumns(items);
	};

	const renderCell = (column, field, index) => {
		const hasError = cellErrors[`${index}-${field}`];
		const isEditing =
			index === editingColumnInfo?.index && editingColumnInfo?.field === field;

		if (isEditing) {
			return (
				<div className="flex flex-col gap-1">
					<Input
						ref={inputRef}
						value={column[field]}
						onChange={(e) => {
							const v = e.target.value;
							setColumns((prev) => {
								const newColumns = [...prev];
								newColumns[index][field] = v;
								return newColumns;
							});
							// clear inline error as user types
							setCellErrors((prev) => {
								const next = { ...prev };
								delete next[`${index}-${field}`];
								return next;
							});
						}}
						onBlur={() => handleBlur(index, field, column[field])}
						autoFocus
						className={`h-8 ${hasError ? 'border-red-500' : ''}`}
					/>
					{hasError && (
						<span className="text-xs text-red-500">{hasError}</span>
					)}
				</div>
			);
		}

		return (
			<div className="flex flex-col gap-1">
				<div
					className="relative group flex items-center justify-between min-h-[32px] group"
					onDoubleClick={() => handleEditCell(index, field)}
				>
					<span className="flex-1">{column[field]}</span>
					<button
						onClick={() => handleEditCell(index, field)}
						className="p-1 bg-white  rounded-md shadow-xl hidden group-hover:block"
					>
						<img src={pencilIcon} className="size-5" />
					</button>
				</div>
				{hasError && (
					<span className="text-xs text-red-500">{hasError}</span>
				)}
			</div>
		);
	};

	const handleSendClick = async () => {
		if (is_clarified || isSubmitting) return;

		if (columns.length === 0) {
			toast.error('Please add at least one column');
			return;
		}

		setIsSubmitting(true);
		try {
			await addClarificationQuery({
				...data,
				tool_data: {
					...data?.tool_data,
					user: {
						columns: [...columns],
					},
				},
			});
		} catch (error) {
			// Error is handled in addClarificationQuery, just reset submitting state
			console.error('Failed to send clarification:', error);
		} finally {
			// Ensure submitting flag is always reset so the UI becomes interactive again
			setIsSubmitting(false);
		}
	};

	return (
		<div className="">
			<p
				className="text-primary80 font-medium cursor-default mb-5"
				style={{ whiteSpace: 'pre-wrap' }}
				dangerouslySetInnerHTML={{
					__html: toolData?.text,
				}}
			></p>

			<DragDropContext onDragEnd={handleDragEnd}>
				<div className="border rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="bg-gray-50 hover:bg-gray-50">
								<TableHead className=""></TableHead>
								<TableHead className="font-semibold text-gray-700">
									Column Name
								</TableHead>
								<TableHead className="font-semibold text-gray-700">
									Description
								</TableHead>
							</TableRow>
						</TableHeader>
						<Droppable droppableId="columns">
							{(provided) => (
								<TableBody
									{...provided.droppableProps}
									ref={provided.innerRef}
								>
									{columns?.length > 0 &&
										columns.map((column, index) => (
											<Draggable
												key={'col_' + index}
												draggableId={'col_' + index}
												index={index}
											>
												{(provided, snapshot) => (
													<TableRow
														ref={provided.innerRef}
														{...provided.draggableProps}
														className={`hover:bg-gray-50 ${
															snapshot.isDragging
																? 'bg-gray-100 shadow-lg'
																: ''
														}`}
													>
														<TableCell className="w-20">
															<div className="flex items-center gap-[0.375rem]">
																<div
																	{...provided.dragHandleProps}
																	className="cursor-grab active:cursor-grabbing"
																>
																	<GripVertical className="size-5 text-gray-400" />
																</div>

																<button
																	onClick={() =>
																		handleDeleteColumn(
																			index,
																		)
																	}
																	className="p-1 bg-white rounded-md "
																	disabled={
																		is_clarified ||
																		isSubmitting
																	}
																>
																	<Trash2 className="size-[1.112rem] text-primary60" />
																</button>
															</div>
														</TableCell>{' '}
														<TableCell className="w-1/4">
															{renderCell(
																column,
																'name',
																index,
															)}
														</TableCell>
														<TableCell>
															{renderCell(
																column,
																'description',
																index,
															)}
														</TableCell>
													</TableRow>
												)}
											</Draggable>
										))}
									{columns?.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={3}
												className="text-center"
											>
												No columns found
											</TableCell>
										</TableRow>
									)}
									{provided.placeholder}
								</TableBody>
							)}
						</Droppable>
					</Table>
					<div className="border-t border-gray-200 p-2 pt-3">
						<button
							onClick={handleAddColumn}
							className="text-[#6A12CD] font-semibold text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={is_clarified || isSubmitting}
						>
							+ Add
						</button>
					</div>
				</div>
			</DragDropContext>

			<div className="flex justify-end">
				<Button
					variant="outline"
					className="mt-4"
					onClick={handleSendClick}
					disabled={is_clarified || !canClarify || isSubmitting}
				>
					{isSubmitting ? 'Sending...' : 'Send'}
				</Button>
			</div>
		</div>
	);
}
