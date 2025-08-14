import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';
import React from 'react';

const Tag = ({ icon, text, textClassName, className, iconClassName }) => {
	return (
		<div
			className={`flex items-center shadow-md px-2 py-1 gap-2 rounded-full bg-[#26064A] ${className}`}
		>
			{icon && (
				<span
					className={cn(
						'material-symbols-outlined text-white',
						iconClassName,
					)}
				>
					{icon}
				</span>
			)}
			<span className={`text-white ${textClassName}`}>{text}</span>
		</div>
	);
};

Tag.propTypes = {
	icon: PropTypes.string,
	text: PropTypes.string.isRequired,
};

export default Tag;
