import React from 'react';

/**
 * GradientSpinner component.
 * @param {Object} props - Component props.
 * @param {number} [props.width=20] - Width of the spinner (must be a multiple of 5).
 * @returns {JSX.Element} - Rendered component.
 */
const GradientSpinner = ({ width = 1, tailwindBg = 'bg-white' }) => {
	// only working on multiple of 5
	// if (width % 5 !== 0) {
	// 	console.warn(
	// 		`Width ${width} is not a multiple of 5. Using default width of 20.`,
	// 	);
	// 	width = 20;
	// }

	const height = width;
	const padding = width / 5.0;

	return (
		<>
			<div
				className={`rounded-full animate-spin-slow direction-reverse`}
				style={{
					padding: `${padding}rem`,
					background:
						'conic-gradient(from 180deg at 50% 50%, #6A12CD 0deg, rgba(106, 18, 205, 0) 360deg)',
				}}
			>
				<div className={`${tailwindBg} rounded-full`}>
					<div
						style={{ width: `${width}rem`, height: `${height}rem` }}
						className="rounded-full"
					></div>
				</div>
			</div>
		</>
	);
};

export default GradientSpinner;
