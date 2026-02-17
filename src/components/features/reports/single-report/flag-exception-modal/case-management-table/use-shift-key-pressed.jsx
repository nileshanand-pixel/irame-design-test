import { useEffect, useRef } from 'react';

// Tracks whether the Shift key is currently pressed using global listeners.
export function useShiftKeyPressedRef() {
	const shiftKeyPressedRef = useRef(false);

	useEffect(() => {
		if (typeof window === 'undefined') return undefined;

		const handleKeyDown = (event) => {
			if (event.key === 'Shift') shiftKeyPressedRef.current = true;
		};
		const handleKeyUp = (event) => {
			if (event.key === 'Shift') shiftKeyPressedRef.current = false;
		};
		const handleBlur = () => {
			shiftKeyPressedRef.current = false;
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('blur', handleBlur);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			window.removeEventListener('blur', handleBlur);
		};
	}, []);

	return shiftKeyPressedRef;
}
