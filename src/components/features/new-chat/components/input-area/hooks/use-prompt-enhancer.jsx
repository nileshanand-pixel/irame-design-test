import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { enhancePrompt } from '../../../service/new-chat.service';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';

export const usePromptEnhancer = (prompt) => {
	const [showStream, setShowStream] = useState(false);

	const disablePromptEnhancer = useMemo(() => {
		return prompt?.trim().split(/\s+/).length <= 3 || showStream;
	}, [prompt, showStream]);

	const streamEnhancedPrompt = (enhancedPrompt, setPromptFn) => {
		setPromptFn('');
		setShowStream(true);

		let i = 0;
		const intervalId = setInterval(() => {
			try {
				setPromptFn((prev) => prev + (enhancedPrompt[i] ?? ''));
				i++;
				if (i >= enhancedPrompt.length) {
					clearInterval(intervalId);
					setShowStream(false);
				}
			} catch (err) {
				console.error('Error in streaming prompt:', err);
				logError(err, { feature: 'chat', action: 'stream-prompt' });
				clearInterval(intervalId);
				setShowStream(false);
				toast.error('Error displaying enhanced prompt');
				setPromptFn(enhancedPrompt);
			}
		}, 20);

		// cleanup on unmount
		return () => clearInterval(intervalId);
	};

	const enhancePromptMutation = useMutation({
		mutationFn: async ({ promptText }) => {
			try {
				return await enhancePrompt(promptText);
			} catch (error) {
				console.error('API error in enhancePrompt:', error);
				logError(error, { feature: 'chat', action: 'enhance-prompt-api' });
				throw new Error(error.message || 'Failed to enhance prompt');
			}
		},
		onSuccess: (enhanced, { promptText, setPromptFn }) => {
			if (enhanced) {
				streamEnhancedPrompt(enhanced, setPromptFn);
			} else {
				setPromptFn(promptText);
				setShowStream(false);
				toast.error("Couldn't enhance prompt. Using original text.");
			}
		},
		onError: (error, { promptText, setPromptFn }) => {
			setPromptFn(promptText);
			setShowStream(false);
			logError(error, { feature: 'chat', action: 'enhance-prompt-error' });
			toast.error(
				error.message ||
					'Something went wrong while enhancing prompt. Please try again',
			);
		},
	});

	const enhancePromptHandler = (promptText, setPromptFn) => {
		if (!promptText || disablePromptEnhancer) return;

		setPromptFn('Enhancing prompt...');
		enhancePromptMutation.mutate({ promptText, setPromptFn });
	};

	return {
		enhancePrompt: enhancePromptHandler,
		isEnhancing: enhancePromptMutation.isPending,
		showStream,
		disablePromptEnhancer,
	};
};
