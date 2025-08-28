import { Dialog, DialogContent } from '@/components/ui/dialog';

export function ChooseExistingModal({ open, setOpen, onChooseExisting }) {
	const handleContinue = () => {
		if (onChooseExisting) onChooseExisting();
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-[600px] border p-0 flex flex-col rounded-lg overflow-hidden gap-0">
				<div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-white">
					<h2 className="text-lg font-semibold text-primary100">
						Select From Existing Data Source
					</h2>
				</div>
				<div className="flex-1 min-h-[200px] flex flex-col items-center justify-center bg-white">
					{/* Placeholder for search and list */}
					<span className="text-gray-400">
						(Data source list will go here)
					</span>
				</div>
				<div className="flex items-center justify-end px-6 py-4 border-t border-[#e5e7eb] bg-white">
					<button
						className="bg-primary text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
						onClick={handleContinue}
					>
						Continue
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
