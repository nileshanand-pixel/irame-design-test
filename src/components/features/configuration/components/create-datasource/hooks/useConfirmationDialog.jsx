import { useCallback, useMemo, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function useConfirmDialog() {
	const [header, setHeader] = useState('');
	const [description, setDescription] = useState('');
	const [promise, setPromise] = useState(null);
	const [secondaryCtaText, setSecondaryCtaText] = useState();
	const [primaryCtaText, setPrimaryCtaText] = useState();
	const [primaryCtaVariant, setPrimaryCtaVariant] = useState();

	const confirm = useCallback(
		({
			header,
			description,
			secondaryCtaText = 'Cancel',
			primaryCtaText = 'Delete',
			primaryCtaVariant = 'destructive',
		}) => {
			setHeader(header);
			setDescription(description);
			secondaryCtaText && setSecondaryCtaText(secondaryCtaText);
			primaryCtaText && setPrimaryCtaText(primaryCtaText);
			primaryCtaVariant && setPrimaryCtaVariant(primaryCtaVariant);

			return new Promise((resolve, _) => {
				setPromise({ resolve });
			});
		},
		[],
	);

	const handleClose = useCallback(() => {
		setPromise(null);
	}, []);

	const handleCancel = useCallback(() => {
		promise?.resolve(false);
		handleClose();
	}, [handleClose, promise]);

	const handleConfirm = useCallback(() => {
		promise?.resolve(true);
		handleClose();
	}, [promise, handleClose]);

	const ConfirmationDialog = useCallback(
		() => (
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
						<Button onClick={handleConfirm} variant={primaryCtaVariant}>
							{primaryCtaText}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		),
		[
			handleClose,
			promise,
			header,
			description,
			handleCancel,
			secondaryCtaText,
			primaryCtaText,
			primaryCtaVariant,
			handleConfirm,
		],
	);

	return [ConfirmationDialog, confirm];
}
