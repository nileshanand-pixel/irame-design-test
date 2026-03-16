import { useState, useEffect, useRef } from 'react';
import throttle from 'lodash.throttle';

export function useThrottle(value, limit) {
	const [throttledValue, setThrottledValue] = useState(value);
	const throttledRef = useRef();

	useEffect(() => {
		throttledRef.current = throttle((val) => {
			setThrottledValue(val);
		}, limit);

		return () => {
			throttledRef.current.cancel();
		};
	}, [limit]);

	useEffect(() => {
		if (throttledRef.current) {
			throttledRef.current(value);
		}
	}, [value]);

	return throttledValue;
}
