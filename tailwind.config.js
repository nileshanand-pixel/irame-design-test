/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{js,jsx}',
		'./components/**/*.{js,jsx}',
		'./app/**/*.{js,jsx}',
		'./src/**/*.{js,jsx}',
	],
	prefix: '',
	theme: {
		container: {
			center: 'true',
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			borderWidth: {
				DEFAULT: '0.0625rem', // This will override the default `border` shorthand
				1: '0.0625rem', // 1px => 0.0625rem
				2: '0.125rem', // 2px => 0.125rem
				4: '0.25rem', // 4px => 0.25rem
				8: '0.5rem', // 8px => 0.5rem
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				purple: {
					1: 'rgba(106, 18, 205, 0.01)',
					2: 'rgba(106, 18, 205, 0.02)',
					4: 'rgba(106, 18, 205, 0.04)',
					8: 'rgba(106, 18, 205, 0.08)',
					10: 'rgba(106, 18, 205, 0.10)',
					16: 'rgba(106, 18, 205, 0.16)',
					20: 'rgba(106, 18, 205, 0.20)',
					24: 'rgba(106, 18, 205, 0.24)',
					40: 'rgba(106, 18, 205, 0.4)',
					80: 'rgba(106, 18, 205, 0.8)',
					100: 'rgba(106, 18, 205, 1)',
					'dusty-purple': 'rgba(125, 106, 146, 1)',
				},
				primary1: 'rgba(38, 6, 74, 0.01)',
				primary2: 'rgba(38, 6, 74, 0.02)',
				primary4: 'rgba(38, 6, 74, 0.04)',
				primary8: 'rgba(38, 6, 74, 0.08)',
				primary10: 'rgba(38, 6, 74, 0.1)',
				primary16: 'rgba(38, 6, 74, 0.16)',
				primary20: 'rgba(38, 6, 74, 0.2)',
				primary60: 'rgba(38, 6, 74, 0.6)',
				primary80: 'rgba(38, 6, 74, 0.8)',
				primary40: 'rgba(38, 6, 74, 0.4)',
				primary100: 'rgba(38, 6, 74, 1)',
				purpleDark: 'rgba(81, 55, 110, 1)',
				state: {
					inProgress: 'rgb(181,71,8)',
					done: 'rgb(2,122,72)',
					error: 'rgba(220, 104, 3, 1)',
				},
				stateBg: {
					inProgress: 'rgb(255, 250, 235)',
					done: 'rgb(236, 253, 243)',
				},
				gray: {
					1: 'rgba(78, 78, 78, 0.1)',
					muted: 'rgba(242, 244, 249, 1)',
				},
				secondary: {
					lightPurple: 'rgba(249, 245, 255, 1)',
					textPurple: 'rgba(105, 65, 198, 1)',
				},
				misc: {
					offWhite: 'rgba(249, 250, 251, 1)',
					black2: 'rgba(0, 0, 0, 0.02)',
					black4: 'rgba(0, 0, 0, 0.04)',
				},
				warning: {
					50: 'rgba(255, 250, 235, 1)',
					700: 'rgba(181, 71, 8, 1)',
					900: 'rgba(219, 119, 7, 1)',
					200: 'rgba(219, 119, 7, 0.16)',
				},
				pill: {
					status: {
						/* Base (dot + text) */
						inProgress: '#0000FF',
						pending: '#FFA500',
						completed: '#008000',

						/* Background */
						inProgressBg: '#EBEEFF',
						pendingBg: '#FFFAEB',
						completedBg: '#F3FFEB',

						/* Border (10%) */
						inProgressBorder: 'rgba(0, 0, 255, 0.1)',
						pendingBorder: 'rgba(219, 119, 7, 0.1)',
						completedBorder: 'rgba(0, 128, 0, 0.1)',
					},

					action: {
						/* Base */
						needAction: '#0000FF',
						bau: '#FFA500',
						systematic: '#6A12CD',
						falsePositive: '#BF2E84',
						approved: '#008000',

						/* Background */
						needActionBg: '#EBEEFF',
						bauBg: '#FFFAEB',
						systematicBg: 'rgba(106, 18, 205, 0.06)',
						falsePositiveBg: '#FFFDFE',
						approvedBg: '#F3FFEB',

						/* Border (10%) */
						needActionBorder: 'rgba(0, 0, 255, 0.1)',
						bauBorder: 'rgba(219, 119, 7, 0.1)',
						systematicBorder: 'rgba(239, 229, 249, 1)',
						falsePositiveBorder: 'rgba(191, 46, 132, 0.1)',
						approvedBorder: 'rgba(0, 128, 0, 0.1)',
					},

					severity: {
						/* Base */
						low: '#B78900',
						medium: '#D97300',
						high: '#DC2626',

						/* Background */
						lowBg: 'rgba(183, 137, 0, 0.1)',
						mediumBg: 'rgba(217, 115, 0, 0.1)',
						highBg: 'rgba(220, 38, 38, 0.1)',

						/* Border (10%) */
						lowBorder: 'rgba(183, 137, 0, 0.2)',
						mediumBorder: 'rgba(217, 115, 0, 0.2)',
						highBorder: 'rgba(220, 38, 38, 0.2)',
					},

					user: {
						bg: '#DBEAFE80',
						avatar: '#C3DCFF',
					},
				},
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0',
					},
					to: {
						height: 'var(--radix-accordion-content-height)',
					},
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)',
					},
					to: {
						height: '0',
					},
				},
				typewriter: {
					to: {
						left: '100%',
					},
				},
				blink: {
					'0%': {
						opacity: '0',
					},
					'0.1%': {
						opacity: '1',
					},
					'50%': {
						opacity: '1',
					},
					'50.1%': {
						opacity: '0',
					},
					'100%': {
						opacity: '0',
					},
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'spin-slow': 'spin 2s ease-in-out infinite',
				typewriter: 'typewriter 2s steps(11) forwards',
				caret: 'typewriter 2s steps(11) forwards, blink 1s steps(11) infinite 2s',
			},
			dropShadow: {
				'1xl': '0px 12px 24px -4px rgba(145, 158, 171, 0.12)',
			},
			boxShadow: {
				'1xl': '0px 12px 24px -4px rgba(145, 158, 171, 0.12)',
				graph: '0 1px 3px 0 rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.10)',
			},
			screens: {
				'h-sm': {
					raw: '(min-height: 750px)',
				},
				'h-cr': {
					raw: '(min-height: 850px)',
				},
				'h-md': {
					raw: '(min-height: 950px)',
				},
				'h-lg': {
					raw: '(min-height: 1000px)',
				},
				'h-xl': {
					raw: '(min-height: 1250px)',
				},
			},
		},
	},
	plugins: [
		require('tailwindcss-animate'),
		require('@tailwindcss/typography'),
		function ({ addUtilities }) {
			addUtilities({
				'.show-scrollbar': {
					'overflow-y': 'auto',
					'scrollbar-width': 'thin',
					'-ms-overflow-style': 'auto',
				},
				'.show-scrollbar::-webkit-scrollbar': {
					width: '6px',
				},
				'.show-scrollbar::-webkit-scrollbar-thumb': {
					backgroundColor: '#a0aec0',
					borderRadius: '6px',
				},
				'.scrollbar-hide': {
					'scrollbar-width': 'none',
					'-ms-overflow-style': 'none',
				},
				'.scrollbar-hide::-webkit-scrollbar': {
					display: 'none',
				},
			});
		},
	],
};
