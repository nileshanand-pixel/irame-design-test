import React, { useRef, useEffect } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import CHAT_CONSTANTS from '@/constants/chat.constant';
import { createPortal } from 'react-dom';
import { mentionInputStyle, mentionStyle } from '../mention-input-styles';
import { getFileIcon } from '@/lib/utils';

// Suggestions portal for rendering mention suggestions outside the input container
const SuggestionsPortal = ({ children }) => {
	const portalNode = useRef(null);

	useEffect(() => {
		if (!document.getElementById('mentions-portal')) {
			const div = document.createElement('div');
			div.id = 'mentions-portal';
			div.style.position = 'absolute';
			div.style.zIndex = '9999';
			document.body.appendChild(div);
		}
		portalNode.current = document.getElementById('mentions-portal');
	}, []);

	return portalNode.current ? createPortal(children, portalNode.current) : null;
};

const SingleInputMode = ({
	prompt,
	onPromptChange,
	onKeyDown,
	disabled,
	files,
	filesLoading,
	dispatch,
	utilReducer,
	updateUtilProp,
	inputRef,
	isWorkflowLocked = false,
	isDisabledWithoutLoading = false,
}) => {
	const localInputRef = useRef(null);
	const actualInputRef = inputRef || localInputRef;
	const inputContainerRef = useRef(null);
	const isQnaDisabled = import.meta.env.VITE_QNA_DISABLED === 'true';

	// Observe and reposition suggestions list when it appears
	useEffect(() => {
		const portalEl = document.getElementById('mentions-portal');
		if (!portalEl || !inputContainerRef.current) return;

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.addedNodes.length > 0) {
					const suggestionsList = portalEl.querySelector('ul');
					if (suggestionsList) {
						const inputRect =
							inputContainerRef.current.getBoundingClientRect();

						suggestionsList.style.position = 'fixed';
						suggestionsList.style.top = 'auto';
						suggestionsList.style.bottom = `calc(${window.innerHeight - inputRect.top}px + 1rem)`;
						suggestionsList.style.left = `${inputRect.left}px`;
						suggestionsList.style.maxHeight = '12.5rem';
					}
				}
			}
		});

		observer.observe(portalEl, { childList: true, subtree: true });

		return () => observer.disconnect();
	}, []);

	return (
		<div className="relative w-full" ref={inputContainerRef}>
			<SuggestionsPortal />
			<div className=" max-h-60 overflow-y-auto w-full">
				<MentionsInput
					value={prompt || ''}
					onChange={(e) => onPromptChange(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder={
						isWorkflowLocked
							? CHAT_CONSTANTS.IRA_INPUT_PLACEHOLDER_LOCKED
							: !(disabled || isQnaDisabled)
								? CHAT_CONSTANTS.IRA_INPUT_PLACEHOLDER
								: CHAT_CONSTANTS.IRA_GENERATING_RESPONSE
					}
					disabled={disabled || isQnaDisabled || isDisabledWithoutLoading}
					inputRef={actualInputRef}
					className={`mentions-input ${isWorkflowLocked ? 'mentions-input--locked' : ''}`}
					suggestionsPortalHost={document.getElementById(
						'mentions-portal',
					)}
					style={mentionInputStyle}
				>
					<Mention
						trigger="@"
						markup="@[__display__](__id__)"
						data={
							filesLoading
								? []
								: files.map((f) => ({
										id: f.id,
										display:
											f.type === 'excel' && f.worksheet
												? `${f.filename} (${f.worksheet})`
												: f.filename,
										file_name: f.worksheet
											? f.worksheet + '.csv'
											: f.filename, // ← include original filename
									}))
						}
						displayTransform={(_id, display) => `@${display}`}
						appendSpaceOnAdd={true}
						style={mentionStyle}
						renderSuggestion={
							filesLoading
								? () => (
										<div className="text-sm px-3 py-2 text-gray-400">
											Loading files…
										</div>
									)
								: (
										suggestion,
										_search,
										highlightedDisplay,
										_index,
										focused,
									) => (
										<div
											className={`flex items-center p-1 text-sm`}
											key={suggestion.id}
										>
											<img
												src={getFileIcon(
													suggestion.file_name,
												)}
												alt="icon"
												className="mr-2 size-5"
											/>
											{highlightedDisplay}
										</div>
									)
						}
					/>
				</MentionsInput>
			</div>
		</div>
	);
};

export default SingleInputMode;
