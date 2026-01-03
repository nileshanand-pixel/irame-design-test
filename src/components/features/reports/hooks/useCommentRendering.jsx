import { useCallback } from 'react';
import { mentionStyle } from '../mentionStyles';

/**
 * Hook for rendering comments with mention tags
 * Parses @[display](id) pattern and renders styled mentions
 */
export const useCommentRendering = () => {
	const renderCommentWithMentions = useCallback((commentText) => {
		if (!commentText) return null;

		// Regex to match @[display](id) pattern
		const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
		const parts = [];
		let lastIndex = 0;
		let match;

		while ((match = mentionRegex.exec(commentText)) !== null) {
			// Add text before mention
			if (match.index > lastIndex) {
				parts.push(commentText.slice(lastIndex, match.index));
			}

			// Add styled mention
			const display = match[1];
			parts.push(
				<span
					key={`mention-${match.index}`}
					style={mentionStyle}
					className="inline-block text-xs"
				>
					@{display}
				</span>,
			);

			lastIndex = mentionRegex.lastIndex;
		}

		// Add remaining text
		if (lastIndex < commentText.length) {
			parts.push(commentText.slice(lastIndex));
		}

		return parts;
	}, []);

	return { renderCommentWithMentions };
};
