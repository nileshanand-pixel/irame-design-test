import React, { memo, useRef, useEffect } from 'react';
import lottie from 'lottie-web';

const Lottie = memo(({ className, path, width, height }) => {
	const containerRef = useRef(null);
	const animationRef = useRef(null);

	useEffect(() => {
		if (containerRef.current) {
			animationRef.current = lottie.loadAnimation({
				container: containerRef.current,
				renderer: 'svg',
				loop: true,
				autoplay: true,
				path: path,
			});
		}

		return () => {
			if (animationRef.current) {
				animationRef.current.destroy();
			}
		};
	}, [path]);

	return (
		<div className={className} ref={containerRef} style={{ width, height }} />
	);
});

export default Lottie;
