import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

// Messages rotate with typing effect
const messages = [
	'Loading domain knowledge modules...',
	'Retrieving relevant datasets...',
	'Storing audit trail securely...',
	'Activating AI Agents...',
	'Evaluating context and constraints...',
	'Preparing user-facing summary...',
];

const TYPING_CONFIG = {
	baseSpeed: 40,
	speedVariation: 20,
	pauseAfterWord: 100,
	pauseAfterMessage: 2000,
	cursorBlinkSpeed: 530,
};

const DiamondAnimation = () => {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress((p) => (p + 0.01) % 1);
		}, 30);
		return () => clearInterval(interval);
	}, []);

	const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
	const smooth = easeInOutSine(progress);

	const startLeft = 0;
	const startRight = 48;
	const center = 24;

	let leftPos, rightPos, overlapping;
	if (smooth <= 0.5) {
		const m = smooth * 2;
		leftPos = startLeft + (center - startLeft) * m;
		rightPos = startRight - (startRight - center) * m;
		overlapping = m > 0.8;
	} else {
		const m = (smooth - 0.5) * 2;
		leftPos = center - (center - startLeft) * m;
		rightPos = center + (startRight - center) * m;
		overlapping = m < 0.2;
	}

	const distance = Math.abs(rightPos - leftPos);
	const veryClose = distance < 6;
	const gray = overlapping;
	const borderColor = gray ? 'border-gray-500' : 'border-black';
	const bgColor = gray ? 'bg-gray-500' : 'bg-transparent';

	return (
		<div className="relative w-20 h-6 mx-auto mb-8">
			{veryClose ? (
				<div
					className={`w-6 h-6 border-2 ${borderColor} ${bgColor} rotate-45 absolute transition-all duration-100`}
					style={{ left: `${(leftPos + rightPos) / 2}px` }}
				/>
			) : (
				<>
					<div
						className={`w-6 h-6 border-2 ${borderColor} ${bgColor} rotate-45 absolute transition-all duration-100`}
						style={{ left: `${leftPos}px` }}
					/>
					<div
						className={`w-6 h-6 border-2 ${borderColor} ${bgColor} rotate-45 absolute transition-all duration-100`}
						style={{ left: `${rightPos}px` }}
					/>
				</>
			)}
		</div>
	);
};

const AnimatedDots = ({ show }) => {
	const [dotCount, setDotCount] = useState(0);
	useEffect(() => {
		if (!show) return;
		const i = setInterval(() => setDotCount((c) => (c + 1) % 4), 500);
		return () => clearInterval(i);
	}, [show]);
	if (!show) return null;
	return <span className="inline-block w-6">{'.'.repeat(dotCount)}</span>;
};

const RotatingMessage = () => {
	const [idx, setIdx] = useState(0);
	const [text, setText] = useState('');
	const [typing, setTyping] = useState(true);
	const [cursor, setCursor] = useState(true);

	useEffect(() => {
		const i = setInterval(
			() => setCursor((p) => !p),
			TYPING_CONFIG.cursorBlinkSpeed,
		);
		return () => clearInterval(i);
	}, []);

	useEffect(() => {
		const msg = messages[idx];
		if (typing) {
			if (text.length < msg.length) {
				const variation = Math.random() * TYPING_CONFIG.speedVariation;
				const isSpace = msg[text.length] === ' ';
				const delay =
					TYPING_CONFIG.baseSpeed +
					variation +
					(isSpace ? TYPING_CONFIG.pauseAfterWord : 0);
				const t = setTimeout(
					() => setText(msg.slice(0, text.length + 1)),
					delay,
				);
				return () => clearTimeout(t);
			} else {
				const t = setTimeout(() => {
					setTyping(false);
					setText('');
					setIdx((p) => (p + 1) % messages.length);
				}, TYPING_CONFIG.pauseAfterMessage);
				return () => clearTimeout(t);
			}
		} else {
			setTyping(true);
		}
	}, [idx, text, typing]);

	const current = messages[idx];
	const endsWithDots = current.endsWith('...');
	const textWithoutDots = endsWithDots ? text.replace(/\.+$/, '') : text;
	const showAnimatedDots = endsWithDots && text === current;

	return (
		<div className="bg-white rounded-2xl px-6 py-2 shadow-md border border-gray-100 flex items-center gap-3 max-w-md mx-auto">
			<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
				<Check className="w-4 h-4 text-white" />
			</div>
			<span className="text-gray-800 font-medium text-sm min-h-[20px] flex items-center">
				{textWithoutDots}
				{showAnimatedDots ? (
					<AnimatedDots show={true} />
				) : endsWithDots && text.includes('.') && text !== current ? (
					'...'
				) : null}
				{typing && !showAnimatedDots && (
					<span
						className={`ml-1 transition-opacity duration-100 ${cursor ? 'opacity-100' : 'opacity-0'}`}
					>
						|
					</span>
				)}
			</span>
		</div>
	);
};

export const CustomLoader = () => {
	return (
		<div className="bg-gray-50 flex items-center justify-center p-16 rounded-lg h-full">
			<div className="w-full flex flex-col gap-4 max-w-2xl">
				<DiamondAnimation />
				<div className="text-center mb-2">
					<h2 className="text-sm text-primary100 font-medium leading-relaxed">
						AI agents are working on your data. Validation and column
						<br />
						mapping in progress...
					</h2>
				</div>
				<RotatingMessage />
			</div>
		</div>
	);
};

export default CustomLoader;
