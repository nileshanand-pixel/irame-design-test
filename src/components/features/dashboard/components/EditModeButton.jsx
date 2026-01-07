import React from 'react';
import { Button } from '@/components/ui/button';
import { LuPencil } from 'react-icons/lu';

const EditModeButton = ({ onClick }) => {
	return (
		<div className="fixed bottom-6 right-6 z-50">
			<Button
				onClick={onClick}
				className="rounded-full px-6 flex items-center gap-2"
			>
				<LuPencil className="size-4" />
				<span className="text-sm font-medium">Edit Mode</span>
				<div className="size-2 bg-white rounded-full"></div>
			</Button>
		</div>
	);
};

export default EditModeButton;
