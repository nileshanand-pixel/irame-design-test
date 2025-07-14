import { useState, useEffect } from 'react';

const getBreakpoint = (width) => {
	if (width >= 1536) return '2xl';
	if (width >= 1280) return 'xl';
	if (width >= 1024) return 'lg';
	if (width >= 768) return 'md';
	if (width >= 640) return 'sm';
	return 'xs'; // Below 640px
};

const useBreakpoint = () => {
	const [breakpoint, setBreakpoint] = useState(getBreakpoint(window.innerWidth));

	useEffect(() => {
		const handleResize = () => {
			setBreakpoint(getBreakpoint(window.innerWidth));
		};

		window.addEventListener('resize', handleResize);
		handleResize(); // Run initially

		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return breakpoint;
};

export default useBreakpoint;
