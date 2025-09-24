import { useCallback } from 'react';
import { toast } from '@/lib/toast';
import { chatCommandInitiator } from '@/lib/utils';
import { logError } from '@/lib/logger';

export const useInputHandlers = ({
	prompt,
	setPrompt,
	mode,
	queries,
	setMode,
	resetQueries,
	savedQueryReference,
	setShowModal,
	resetSecondaryModalData,
	singleInputRef,
	transformMentions,
	onAppendQuery,
	isEnhancing,
}) => {
	const handlePromptChange = useCallback(
		(value) => {
			setPrompt(value);
			if (!value) {
				setShowModal(false);
				resetSecondaryModalData();
			} else if (chatCommandInitiator(value)) {
				setShowModal(true);
			} else {
				setShowModal(false);
			}
		},
		[setPrompt, setShowModal, resetSecondaryModalData],
	);

	const handleSend = useCallback(async () => {
		if (isEnhancing && mode === 'single') return;

		try {
			const cleanedPrompt = transformMentions(prompt);
			await onAppendQuery(cleanedPrompt, queries, savedQueryReference, mode);
			setPrompt(null); // Force unmount
			setTimeout(() => setPrompt(''), 0); // Restore after re-render
			resetQueries();
			setMode('single');
		} catch (error) {
			logError(error, { feature: 'chat', action: 'send-message' });
			toast.error('Failed to send message. Please try again.');
		}
	}, [
		prompt,
		queries,
		savedQueryReference,
		mode,
		transformMentions,
		onAppendQuery,
		setPrompt,
		resetQueries,
		setMode,
		isEnhancing,
	]);

	const handleSwitchToSimpleMode = useCallback(() => {
		setMode('single');
		resetQueries();
		setPrompt('');

		// Focus the single input after mode switch
		setTimeout(() => {
			if (singleInputRef?.current) {
				singleInputRef.current.focus();
			}
		}, 0);
	}, [setMode, resetQueries, setPrompt, singleInputRef]);

	const handleKeyDown = useCallback(
		(event, firstActionRef) => {
			if (event.ctrlKey && event.keyCode === 13) {
				event.preventDefault();
				handleSend();
			} else if (
				event.keyCode === 13 &&
				!event.shiftKey &&
				!event.ctrlKey &&
				setShowModal
			) {
				if (firstActionRef?.current?.click) {
					firstActionRef.current.click();
				}
			}
		},
		[handleSend, setShowModal],
	);

	return {
		handlePromptChange,
		handleSend,
		handleSwitchToSimpleMode,
		handleKeyDown,
	};
};
