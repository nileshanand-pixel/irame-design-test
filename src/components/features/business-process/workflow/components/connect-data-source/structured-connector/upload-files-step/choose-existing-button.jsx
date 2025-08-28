import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChooseExistingModal } from './choose-existing-modal';

export function ChooseExistingButton({ onChooseExisting, selectedDataSources }) {
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<>
			<Button
				type="button"
				variant="outline"
				className="flex items-center gap-2 bg-white font-semibold px-5 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10"
				onClick={() => setIsModalOpen(true)}
			>
				<svg
					className="w-5 h-5"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					viewBox="0 0 24 24"
				>
					<circle
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="2"
						fill="none"
					/>
					<path
						d="M8 12h8M12 8v8"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
					/>
				</svg>
				<span>Choose Existing</span>
			</Button>
			<ChooseExistingModal
				open={isModalOpen}
				setOpen={setIsModalOpen}
				onChooseExisting={onChooseExisting}
				selectedDataSources={selectedDataSources}
			/>
		</>
	);
}
