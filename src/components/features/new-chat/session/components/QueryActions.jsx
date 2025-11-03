import React, { useState, useMemo, useRef } from 'react';
import SiblingNavigation from './SiblingNavigation';
import { Bookmark, Check, Copy, Pencil } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import {
	saveTemplate,
	deleteTemplate,
} from '@/components/features/new-chat/service/new-chat.service';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
import { Button } from '@/components/ui/button';

/**
 * Query actions row rendered under a query bubble
 * Shows: sibling navigation + bookmark + copy + edit
 */
const QueryActions = ({
	siblingInfo,
	onNavigate,
	onEdit,
	disabled = false,
	disableEdit = false,
	queryText = '', // The query text to save/copy
	queryId, // The query ID for reference
	savedQueryReference = null, // {id, title} if query is already saved
	onDeleteSuccess, // Callback after successful delete
	setUserHasNavigated,
	setDisableAutoScroll,
}) => {
	const [copied, setCopied] = useState(false);
	const [ConfirmationDialog, confirm] = useConfirmDialog();

	// Check if this query is already saved
	// savedQueryReference.id is the saved template ID, not the query ID
	const isSaved = useMemo(() => {
		return !!savedQueryReference?.id;
	}, [savedQueryReference]);

	// Handle copy to clipboard
	const handleCopy = async () => {
		if (!queryText) return;
		try {
			await navigator.clipboard.writeText(queryText);
			setCopied(true);
			toast.success('Query copied to clipboard');
			setTimeout(() => setCopied(false), 1500);
		} catch (err) {
			console.error('Failed to copy:', err);
			toast.error('Failed to copy query');
		}
	};

	// Handle save query as template
	const saveTemplateMutation = useMutation({
		mutationFn: async () => {
			const data = {
				name: queryText.slice(0, 40) || 'Untitled Template',
				type: 'workflow',
				data: {
					reference_query_id: queryId,
					queries: [{ text: queryText }],
				},
			};
			await saveTemplate(data);
		},
		onSuccess: () => {
			toast.success('Query saved successfully!');
			if (onDeleteSuccess) {
				onDeleteSuccess();
			}
		},
		onError: (err) => {
			console.error('Error saving query:', err);
			toast.error('Failed to save query');
		},
	});

	// Handle delete saved query
	const deleteTemplateMutation = useMutation({
		mutationFn: async () => {
			if (!savedQueryReference?.id) {
				throw new Error('No saved query ID found');
			}
			await deleteTemplate(savedQueryReference.id);
		},
		onSuccess: () => {
			toast.success('Saved query deleted successfully');
			if (onDeleteSuccess) {
				onDeleteSuccess();
			}
		},
		onError: (err) => {
			console.error('Error deleting query:', err);
			toast.error('Failed to delete query');
		},
	});

	const handleBookmark = async () => {
		setDisableAutoScroll?.(true); // Disable auto-scroll for bookmark operation

		if (
			saveTemplateMutation.isPending ||
			deleteTemplateMutation.isPending ||
			!queryText
		)
			return;

		if (isSaved) {
			// Delete saved query
			const confirmed = await confirm({
				header: 'Delete Saved Query?',
				description:
					'This will permanently delete this saved query. This action cannot be undone.',
			});

			if (confirmed) {
				deleteTemplateMutation.mutate();
			}
		} else {
			// Save query
			saveTemplateMutation.mutate();
		}
	};

	return (
		<div className="flex items-center gap-1 text-primary100">
			{/* Sibling navigation on the left */}
			<SiblingNavigation
				siblingInfo={siblingInfo}
				onNavigate={onNavigate}
				disabled={false}
			/>

			{/* Bookmark */}
			<button
				onClick={handleBookmark}
				disabled={
					saveTemplateMutation.isPending ||
					deleteTemplateMutation.isPending
				}
				className=" hover:bg-purple-4 hover:scale-105 transition-all duration-150 rounded-md p-0"
				title={
					saveTemplateMutation.isPending
						? 'Saving...'
						: deleteTemplateMutation.isPending
							? 'Deleting...'
							: isSaved
								? 'Delete saved query'
								: 'Save query'
				}
			>
				{saveTemplateMutation.isPending ||
				deleteTemplateMutation.isPending ? (
					<div className="w-9 h-9 p-2 flex items-center justify-center">
						<svg
							className="animate-spin w-5 h-5"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							></circle>
							<path
								className="opacity-75"
								fill="currentColor"
								d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
					</div>
				) : (
					<Bookmark
						className={`h-9 w-9 p-2 ${isSaved ? 'fill-primary text-primary' : ''}`}
					/>
				)}
			</button>

			{/* Copy */}
			<button
				onClick={handleCopy}
				className=" hover:bg-purple-4 hover:scale-105 transition-all duration-150 rounded-md p-0"
				title={copied ? 'Copied!' : 'Copy to clipboard'}
			>
				{copied ? (
					<Check className="h-9 w-9 p-2" />
				) : (
					<Copy className="h-9 w-9 p-2" />
				)}
			</button>

			{/* Edit */}
			{onEdit && (
				<Button
					variant="ghost"
					onClick={onEdit}
					disabled={disableEdit}
					className=" hover:bg-purple-4 hover:scale-105 transition-all duration-150 rounded-md p-0 "
					title="Edit query"
				>
					<Pencil className="h-9 w-9 p-2" />
				</Button>
			)}
			<ConfirmationDialog />
		</div>
	);
};

export default QueryActions;
