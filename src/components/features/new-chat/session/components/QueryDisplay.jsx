import { SelectSeparator } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { QUERY_TYPES } from '@/constants/query-type.constant';

const QueryDisplay = ({
	bulkPrompt = [],
	mode,
	prompt,
	workflowTitle,
	isEditing = false,
	onSave,
	onCancel,
	createdAt,
	isClarificationQuery = false,
}) => {
	const [editedPrompt, setEditedPrompt] = useState(prompt || '');
	const textareaRef = useRef(null);

	console.log('mode:', mode, workflowTitle);

	const formatTimestamp = (ts) => {
		if (!ts) return '';

		const date = new Date(ts);

		const month = date.toLocaleString('en-US', { month: 'short' });
		const day = date.getDate();
		let hours = date.getHours();
		const minutes = String(date.getMinutes()).padStart(2, '0');

		const ampm = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12 || 12;

		return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
	};

	useEffect(() => {
		setEditedPrompt(prompt || '');
	}, [prompt]);

	useEffect(() => {
		if (isEditing && textareaRef.current) {
			const el = textareaRef.current;
			el.focus();
			el.selectionStart = el.selectionEnd = el.value.length;
		}
	}, [isEditing]);

	useEffect(() => {
		if (isEditing && textareaRef.current) {
			const el = textareaRef.current;
			el.style.height = 'auto';
			el.style.height = el.scrollHeight + 'px';
		}
	}, [isEditing, editedPrompt]);

	if (!bulkPrompt || !prompt) {
		return <Skeleton className="h-6 w-full bg-purple-8 ms-1" />;
	}

	// ---- SINGLE MODE ----
	if (mode === 'single' && prompt) {
		// EDIT MODE
		if (isEditing) {
			const handleKeyDown = (e) => {
				if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
					e.preventDefault();
					const trimmedPrompt = editedPrompt.trim();
					if (trimmedPrompt && trimmedPrompt !== prompt && onSave) {
						onSave(trimmedPrompt);
					}
				}
				if (e.key === 'Escape') {
					e.preventDefault();
					setEditedPrompt(prompt);
					if (onCancel) onCancel();
				}
			};

			return (
				<div className="w-full max-w-[75%] bg-purple-4 my-2 px-4 mb-2 py-2 rounded-xl rounded-tr-md text-base">
					<textarea
						ref={textareaRef}
						value={editedPrompt}
						onChange={(e) => setEditedPrompt(e.target.value)}
						onKeyDown={handleKeyDown}
						className="w-full bg-transparent outline-none resize-none text-primary80 font-medium overflow-hidden"
						rows={2}
						placeholder="Edit your query..."
					/>
					<div className="flex justify-end gap-3 mt-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setEditedPrompt(prompt);
								if (onCancel) onCancel();
							}}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							className="bg-primary text-white"
							onClick={() => {
								const trimmedPrompt = editedPrompt.trim();
								if (
									trimmedPrompt &&
									trimmedPrompt !== prompt &&
									onSave
								)
									onSave(trimmedPrompt);
							}}
							disabled={
								!editedPrompt.trim() ||
								editedPrompt.trim() === prompt
							}
						>
							Send
						</Button>
					</div>
				</div>
			);
		}

		// DISPLAY MODE
		return (
			<div className="group flex gap-4 mb-2 ms-2 max-w-[80%] items-center">
				<span className="text-base text-primary80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
					{formatTimestamp(createdAt)}
				</span>

				<p
					className="bg-purple-4 text-primary80 font-medium px-4 py-2 
       rounded-tl-xl rounded-tr-md rounded-bl-xl rounded-br-xl text-base cursor-default"
				>
					{isClarificationQuery ? 'Clarification Submitted.' : prompt}
				</p>
			</div>
		);
	}

	// ---- BULK / WORKFLOW MODE ----
	const getLabel = (index) => {
		const labelNumber = ` ${String(index + 1).padStart(2, '0')}`;
		return mode === 'bulk' ? 'Query' + labelNumber : 'Step' + labelNumber;
	};

	return (
		<div className="group flex gap-4 mb-2 ms-2 max-w-[80%] items-center">
			<span className="text-base text-primary80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				{formatTimestamp(createdAt)}
			</span>
			<div className="space-y-4 flex gap-4 bg-purple-4 px-4 py-2 rounded-xl">
				{bulkPrompt?.map((query, index) => (
					<div key={query.id} className="!m-0">
						{(mode === QUERY_TYPES.WORKFLOW ||
							mode === QUERY_TYPES.SQL_WORKFLOW) &&
							index === 0 && (
								<>
									<span className="text-sm px-2 font-medium text-primary40">
										{workflowTitle || 'Untitled Workflow'}
									</span>
									<Separator className="!mt-1 !mb-3 !ml-2 w-9/10" />
								</>
							)}{' '}
						<div className="px-2 rounded-lg">
							{/* <h2 className="text-xs font-semibold text-primary40">
								{getLabel(index)}:
							</h2> */}
							<p className="text-primary80">{query.text}</p>
						</div>
						{index !== bulkPrompt.length - 1 && <Separator />}
					</div>
				))}
			</div>
		</div>
	);
};

export default QueryDisplay;
