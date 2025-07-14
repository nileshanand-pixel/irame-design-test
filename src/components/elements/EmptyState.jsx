import React from 'react';
import { Button } from '@/components/ui/button';

const EmptyState = ({ config, className }) => {
	const {
		image,
		actionText,
		reactionText,
		ctaText,
		ctaClickHandler,
		ctaDisabled,
		comingSoonText,
	} = config;

	return (
		<div
			className={`flex flex-col items-center justify-center h-[85vh] p-4 ${className}`}
		>
			<div className="text-center">
				{image && (
					<div className="mb-8">
						<img
							src={image}
							alt="Empty state"
							className="mx-auto w-96 h-96"
						/>
					</div>
				)}
				{actionText && <p className="mb-2 text-black/40">{actionText}</p>}
				{reactionText && (
					<p className="text-black/80 font-semibold mb-6">
						{reactionText}
					</p>
				)}
				{ctaText && (
					<Button
						className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
						disabled={ctaDisabled}
						onClick={ctaClickHandler}
					>
						{ctaText}
					</Button>
				)}
				{comingSoonText && (
					<p className="mt-8 font-semibold text-primary">
						{comingSoonText}
					</p>
				)}
			</div>
		</div>
	);
};

export default EmptyState;
