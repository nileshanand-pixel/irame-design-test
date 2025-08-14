import React from 'react';
/**
 * @param {Object} props - component props
 * @param {string} [props.tailwindBg='bg-black'] - background color in tailwind format e.g bg-black 
 * @param {string} [props.size='4px']- size of dot in px e.g - '4px'

 * @returns 
 */
const DotLoader = ({ size = '0.25rem' }) => {
	const circleClass = `my-12 rounded-full`;
	const sizeStyle = { width: size, height: size };

	const styles = `
    @keyframes loader {
      to {
        transform: translate3d(0, 0.35rem, 0);
      }
    }

    .animate-loader {
      animation: loader 0.9s infinite alternate;
    }

    .animation-delay-200 {
      animation-delay: 0.3s;
    }

    .animation-delay-400 {
      animation-delay: 0.6s;
    }
  `;

	return (
		<>
			<style>{styles}</style>
			<div className="flex ms-1 gap-1 justify-center">
				<span
					style={sizeStyle}
					className={`animate-loader bg-[#26064ACC]  ${circleClass}`}
				></span>
				<span
					style={sizeStyle}
					className={`animate-loader bg-[#26064ACC] animation-delay-200 ${circleClass}`}
				></span>
				<span
					style={sizeStyle}
					className={`animate-loader bg-[#26064ACC] animation-delay-400 ${circleClass}`}
				></span>
			</div>
		</>
	);
};

export default DotLoader;
