import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LuSettings } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import SetThresholdAlertModal from './SetThresholdAlertModal';

const SettingsDropdown = () => {
	const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

	const handleOpenModal = () => {
		setIsAlertModalOpen(true);
	};

	return (
		<>
			<Button
				variant="outline"
				size="icon"
				onClick={handleOpenModal}
				className={cn(
					'border-gray-200 text-[#26064A] bg-white hover:bg-gray-50',
					'w-10 h-10',
				)}
			>
				<LuSettings className="w-4 h-4" />
			</Button>

			<SetThresholdAlertModal
				open={isAlertModalOpen}
				onOpenChange={setIsAlertModalOpen}
			/>
		</>
	);
};

export default SettingsDropdown;
