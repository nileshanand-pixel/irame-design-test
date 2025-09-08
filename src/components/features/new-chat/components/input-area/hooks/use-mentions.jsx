import { useCallback } from 'react';

export const useMentions = (prompt, setPrompt, inputRef, mode) => {
	const transformMentions = useCallback((text) => {
		if (!text || !text.includes('@[')) return text;
		return text.replace(/@\[(.*?)\]\((.*?)\)/g, '@$1');
	}, []);

	const handleMentionClick = useCallback(() => {
		if (mode === 'single' && inputRef?.current) {
			const textarea = inputRef.current;
			textarea.focus();

			const start = textarea.selectionStart ?? 0;
			const end = textarea.selectionEnd ?? 0;
			const before = prompt?.slice(0, start) || '';
			const after = prompt?.slice(end) || '';

			const newValue = before + '@' + after;
			setPrompt(newValue);

			setTimeout(() => {
				const caret = start + 1;
				textarea.setSelectionRange(caret, caret);

				['keydown', 'keypress', 'input', 'keyup'].forEach((type) => {
					let event;
					if (type === 'input') {
						event = new Event('input', { bubbles: true });
					} else {
						event = new KeyboardEvent(type, {
							key: '@',
							code: 'Digit2',
							charCode: 64,
							keyCode: 64,
							which: 64,
							bubbles: true,
							cancelable: true,
						});
					}
					textarea.dispatchEvent(event);
				});
			}, 0);
		}
	}, [mode, prompt, setPrompt, inputRef]);

	return {
		transformMentions,
		handleMentionClick,
	};
};
