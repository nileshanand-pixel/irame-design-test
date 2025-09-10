import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

export default function useConfirmDialog() {
	const [header, setHeader] = useState('');
	const [description, setDescription] = useState('');
	const [promise, setPromise] = useState(null);
	const [secondaryCtaText, setSecondaryCtaText] = useState();
	const [primaryCtaText, setPrimaryCtaText] = useState();

	const confirm = ({
		header,
		description,
		secondaryCtaText = 'Cancel',
		primaryCtaText = 'Delete',
	}) => {
		setHeader(header);
		setDescription(description);
		secondaryCtaText && setSecondaryCtaText(secondaryCtaText);
		primaryCtaText && setPrimaryCtaText(primaryCtaText);

		return new Promise((resolve, _) => {
			setPromise({ resolve });
		});
	};

	const handleClose = () => {
		setPromise(null);
	};

	const handleCancel = () => {
		promise?.resolve(false);
		handleClose();
	};

	const handleConfirm = () => {
		promise?.resolve(true);
		handleClose();
	};

	const ConfirmationDialog = () => (
		<Dialog open={promise !== null} onOpenChange={handleClose}>
			<DialogContent className="max-w-md p-6 rounded-lg gap-0">
				<DialogHeader>
					<DialogTitle className="text-lg font-semibold text-primary100">
						{header}
					</DialogTitle>
					<DialogDescription className="text-sm text-primary80 font-normal mt-4">
						{description}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="flex justify-end gap-3 mt-6 text-sm font-medium">
					<Button
						onClick={handleCancel}
						variant="outline"
						className="border-primary text-primary hover:bg-purple-50"
					>
						{secondaryCtaText}
					</Button>
					<Button onClick={handleConfirm} variant="destructive">
						{primaryCtaText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	return [ConfirmationDialog, confirm];
}
