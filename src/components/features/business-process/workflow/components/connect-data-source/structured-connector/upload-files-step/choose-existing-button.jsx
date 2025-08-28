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
				className="flex items-center gap-2 bg-white  rounded-lg border border-primary text-purple-100 hover:text-purple-100 hover:bg-primary/10"
				onClick={() => setIsModalOpen(true)}
			>
				<span className="material-symbols-outlined text-xl">database</span>
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
