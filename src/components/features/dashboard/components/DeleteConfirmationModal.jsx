import React from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LuTrash2 } from 'react-icons/lu';
import CircularLoader from '@/components/elements/loading/CircularLoader';

const DeleteConfirmationModal = ({
	open,
	onOpenChange,
	onConfirm,
	itemType = 'item',
	isLoading = false,
}) => {
	const handleConfirm = () => {
		if (isLoading) return;
		onConfirm();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
				<DialogHeader className="flex flex-col gap-0">
					<div className="flex items-center gap-3 mb-2">
						<div className="w-10 h-10 bg-[#FEE2E2] rounded-lg flex items-center justify-center">
							<LuTrash2 className="w-5 h-5 text-[#EF4444]" />
						</div>
						<DialogTitle className="text-lg font-semibold text-[#26064A]">
							Delete{' '}
							{itemType === 'graph'
								? 'Graph'
								: itemType === 'table'
									? 'Table'
									: 'Item'}
							?
						</DialogTitle>
					</div>
					<DialogDescription className="text-sm text-gray-600 mt-2">
						Are you sure you want to delete this {itemType}? This action
						cannot be undone.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="flex justify-end gap-3 mt-6">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="border-gray-200 text-[#26064A] hover:bg-gray-50"
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={isLoading}
						className="bg-[#EF4444] hover:bg-[#DC2626] text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{isLoading && <CircularLoader size="sm" />}
						{isLoading ? 'Deleting...' : 'Delete'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DeleteConfirmationModal;
