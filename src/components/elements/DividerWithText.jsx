import React from 'react';

const DividerWithText = ({ text = 'Or', className = '' }) => {
	return (
		<div className={`flex items-center gap-1 w-full ${className}`}>
			<div className="flex-grow border-t border-primary20"></div>
			<span className="mx-2 text-gray-400">{text}</span>
			<div className="flex-grow border-t border-primary20"></div>
		</div>
	);
};

export default DividerWithText;
