import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Component to navigate between sibling queries
 */
const SiblingNavigation = ({ siblingInfo, onNavigate, disabled = false }) => {
	if (!siblingInfo.hasSiblings) {
		return null;
	}

	const handlePrevious = () => {
		if (siblingInfo.currentIndex > 0) {
			onNavigate(siblingInfo.currentIndex - 1);
		}
	};

	const handleNext = () => {
		if (siblingInfo.currentIndex < siblingInfo.total - 1) {
			onNavigate(siblingInfo.currentIndex + 1);
		}
	};

	return (
		<div className="flex items-center gap-1 text-sm text-primary60">
			<Button
				variant="ghost"
				size="sm"
				className="h-6 w-6 p-0"
				onClick={handlePrevious}
				disabled={disabled || siblingInfo.current === 1}
			>
				<i className="bi-chevron-left text-xs"></i>
			</Button>

			<span className="text-xs font-medium px-1">
				{siblingInfo.current}/{siblingInfo.total}
			</span>

			<Button
				variant="ghost"
				size="sm"
				className="h-6 w-6 p-0"
				onClick={handleNext}
				disabled={disabled || siblingInfo.current === siblingInfo.total}
			>
				<i className="bi-chevron-right text-xs"></i>
			</Button>
		</div>
	);
};

export default SiblingNavigation;
