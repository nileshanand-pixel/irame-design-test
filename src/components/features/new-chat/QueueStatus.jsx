import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import GradientSpinner from '@/components/elements/loading/GradientSpinner';
import DotLoader from '@/components/elements/loading/DotLoader';
import Typewriter from '@/components/elements/Typewriter';
import upperFirst from 'lodash.upperfirst';

const QueueStatus = ({ text }) => {
	useEffect(() => {}, [text]);

	const gradientStyle = {
		background: `
linear-gradient(180deg, rgba(106, 18, 205, 0.02) 0%, rgba(106, 18, 205, 0.08) 100%)`,
	};

	return (
		<div
			style={gradientStyle}
			className="min-w-60 w-fit h-[54px] flex gap-8 rounded-2xl border-[#6A12CD0A]"
		>
			<div className="w-[10%] flex justify-center items-center pl-8">
				<GradientSpinner tailwindBg={'bg-[#f8f3fd]'} width={15} />
			</div>
			<div className="w-fit flex pl-4 items-center border-l-[1px] border-l-[#26064A1A]">
				<span className="text-[#26064ACC]">
					<Typewriter text={upperFirst(text)} />
				</span>
				<span>
					<DotLoader size="3px" />
				</span>
			</div>
		</div>
	);
};

QueueStatus.propTypes = {
	text: PropTypes.string.isRequired,
};

export default QueueStatus;
