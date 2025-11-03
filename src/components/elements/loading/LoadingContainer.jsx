import React from 'react';

const LoadingContainer = ({
	width = 1,
	tailwindBg = 'bg-white',
	children,
	className = '',
}) => {
	const size = `${width}rem`;
	const padding = width - 1;

	return (
		<div
			className={`relative flex items-center justify-center ${className}`}
			style={{ width: size, height: size }}
		>
			<div
				className="rounded-full animate-spin-slow"
				style={{
					padding: `${padding}rem`,
					width: size,
					height: size,
					background:
						'conic-gradient(from 180deg at 50% 50%, #6A12CD 0deg, rgba(106, 18, 205, 0) 360deg)',
				}}
			/>

			<div
				className={`${tailwindBg} rounded-full absolute inset-0 flex items-center justify-center`}
			>
				{children}
			</div>
		</div>
	);
};

export default LoadingContainer;
