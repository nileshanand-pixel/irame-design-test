export const mentionsInputStyle = {
	control: {
		fontSize: '0.875rem', // 14px
		lineHeight: '1.375rem', // 22px
		minHeight: '2.75rem', // 44px
		boxSizing: 'border-box',
		position: 'relative',
	},

	'&multiLine': {
		control: {
			fontFamily: 'inherit',
			boxSizing: 'border-box',
			position: 'relative',
		},

		// Highlight layer (mentions + text behind)
		highlighter: {
			fontSize: '0.75rem', // 12px
			padding: '0.125rem 0.5rem',
			lineHeight: '1.375rem',
			whiteSpace: 'pre-wrap',
			wordWrap: 'break-word',
			boxSizing: 'border-box',
			color: '#111827',

			position: 'absolute',
			top: '-0.2rem',
			left: '0.5rem',
			right: 0,
			bottom: 0,
			zIndex: 2,
			pointerEvents: 'none',
		},

		// Actual textarea
		input: {
			fontSize: '0.875rem',
			padding: '0 1.125rem',
			border: 'none',
			outline: 'none',
			resize: 'none',
			lineHeight: '1.375rem',
			whiteSpace: 'pre-wrap',
			wordWrap: 'break-word',
			boxSizing: 'border-box',
			minHeight: '2.75rem',
			position: 'relative',
			zIndex: 1,
		},
	},

	/* =========================
       SUGGESTIONS DROPDOWN
       ========================= */
	suggestions: {
		list: {
			position: 'absolute',
			bottom: '100%',
			left: 0,

			width: '20rem',
			maxWidth: '90vw',
			maxHeight: '11.5rem',

			overflowY: 'scroll',
			overflowX: 'hidden',

			backgroundColor: '#ffffff',
			border: '1px solid #e5e7eb',
			borderRadius: '0.5rem',
			boxShadow: '0 8px 24px rgba(0,0,0,0.08)',

			padding: 0,
			marginBottom: '2rem',
			zIndex: 1000,

			scrollbarWidth: 'thin',
			scrollbarColor: '#C7C7CC transparent',
		},

		item: {
			padding: 0, // handled in renderSuggestion
			cursor: 'pointer',

			'&focused': {
				backgroundColor: '#6A12CD0A',
			},
		},
	},
};

export const mentionStyle = {
	backgroundColor: '#F1EAFE', // pre-blended light purple
	color: '#26064ACC',
	fontWeight: 400,
	padding: '0.125rem 0.5rem', // 2px 8px
	borderRadius: '0.25rem',
	border: '1px solid #6A12CE14', // intentionally left as px (pill)
	display: 'inline-block',
	lineHeight: '1.125rem', // 18px
	verticalAlign: 'baseline',
};
