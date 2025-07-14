import React from 'react';
import { cn } from '@/lib/utils';

const BackdropLoader = ({
	size = 'md', // Default size
	loaderColor = 'border-primary80', // Loader color
	trackColor = 'border-gray-300', // Track color
	backgroundColor = 'bg-black/50', // Backdrop color
	className = '', // Additional classnames
}) => {
	const sizes = {
		sm: 'w-6 h-6 border-2',
		md: 'w-12 h-12 border-4',
		lg: 'w-20 h-20 border-8',
	};

	return (
		<div
			className={cn(
				'fixed inset-0 flex items-center justify-center z-50',
				backgroundColor,
				className,
			)}
		>
			<div
				className={cn(
					'animate-spin rounded-full',
					sizes[size],
					trackColor,
					loaderColor,
				)}
				style={{ borderTopColor: 'transparent' }} // Makes the spinner rotate
			></div>
		</div>
	);
};

export default BackdropLoader;
