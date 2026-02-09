import { useState, useEffect, useRef } from 'react';
import debounce from 'lodash.debounce';

export function useDebounce(value, delay) {
	const [debouncedValue, setDebouncedValue] = useState(value);
	const debouncedRef = useRef();

	useEffect(() => {
		debouncedRef.current = debounce((val) => {
			setDebouncedValue(val);
		}, delay);

		return () => {
			debouncedRef.current.cancel();
		};
	}, [delay]);

	useEffect(() => {
		if (debouncedRef.current) {
			debouncedRef.current(value);
		}
	}, [value]);

	return debouncedValue;
}
