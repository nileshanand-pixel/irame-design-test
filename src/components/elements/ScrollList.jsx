import React, { useEffect, useRef, useState } from 'react';

const ScrollList = ({ children }) => {
	const containerRef = useRef(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const updateScrollState = () => {
		if (containerRef.current) {
			const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
			setCanScrollLeft(scrollLeft > 0);
			setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
		}
	};

	useEffect(() => {
		updateScrollState();

		const handleResize = () => {
			updateScrollState();
		};

		window.addEventListener('resize', handleResize);
		containerRef.current.addEventListener('scroll', updateScrollState);

		return () => {
			window.removeEventListener('resize', handleResize);
			if (containerRef.current) {
				containerRef.current.removeEventListener(
					'scroll',
					updateScrollState,
				);
			}
		};
	}, []);

	const handleScroll = (direction) => {
		if (containerRef.current) {
			const scrollAmount =
				direction === 'left'
					? -containerRef.current.clientWidth
					: containerRef.current.clientWidth;
			containerRef.current.scrollBy({
				left: scrollAmount,
				behavior: 'smooth',
			});
		}
	};

	return (
		<div className="flex gap-4 items-center">
			{canScrollLeft && (
				<div className="cursor-pointer" onClick={() => handleScroll('left')}>
					<i className="bi bi-caret-left border text-gray-500 border-black/10 rounded-full w-[32px] py-[8px] px-[4px]" />
				</div>
			)}
			<ul
				className="flex overflow-x-scroll gap-2 items-center"
				ref={containerRef}
			>
				{children}
			</ul>
			{canScrollRight && (
				<div
					className="cursor-pointer"
					onClick={() => handleScroll('right')}
				>
					<i className="bi bi-caret-right border text-gray-500 border-black/10 rounded-full w-[32px] py-[8px] px-[4px]" />
				</div>
			)}
		</div>
	);
};

export default ScrollList;
