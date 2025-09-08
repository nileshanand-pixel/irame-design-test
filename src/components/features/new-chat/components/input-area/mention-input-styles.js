export const mentionInputStyle = {
	color: 'rgba(38, 6, 74, 0.8)',
	control: {
		backgroundColor: 'transparent',
		fontSize: '0.875rem',
		lineHeight: '1.25rem',
		width: '100%',
	},
	'&multiLine': {
		control: {
			fontFamily: 'inherit',
			minHeight: '1rem',
		},
		highlighter: {
			padding: '0.5rem',
			boxSizing: 'border-box',
		},
		input: {
			padding: '0.5rem',
			outline: 'none',
			border: 'none',
			boxSizing: 'border-box',
		},
	},
	suggestions: {
		list: {
			backgroundColor: '#fff',
			border: '0.0625rem solid #ccc',
			borderRadius: '0.5rem',
			fontSize: '0.875rem',
			overflowY: 'auto',
			zIndex: 9999,
			boxShadow: '0 0.125rem 0.5rem rgba(0, 0, 0, 0.15)',
		},
		item: {
			padding: '0.375rem 0.75rem',
			borderBottom: '0.0625rem solid #eee',
			'&focused': {
				backgroundColor: 'rgba(106, 18, 205, 0.12)',
			},
		},
	},
};

export const mentionStyle = {
	backgroundColor: 'rgba(106, 18, 205, 0.12)',
	padding: '0.0625rem 0 0',
};
