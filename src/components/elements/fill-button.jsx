import { useState, useEffect, useCallback, useRef } from 'react';

export default function FillButton({
	children,
	duration = 3000,
	onComplete = () => {},
	baseColor = 'bg-primary8',
	fillColor = 'bg-purple-100',
	baseTextColor = 'text-primary80',
	fillTextColor = 'text-white',
	baseGradient = '',
	fillGradient = '',
	className = '',
	disabled = false,
	width = 'w-24',
	height = 'h-10',
	autoStart = false,
	useGradient = false,
	allowPause = false,
	showStatus = true,
}) {
	const [progress, setProgress] = useState(0);
	const [isActive, setIsActive] = useState(false);
	const [isCompleted, setIsCompleted] = useState(false);
	const [isPaused, setIsPaused] = useState(false);

	// Refs to track animation timing precisely
	const startTimeRef = useRef(null);
	const pauseTimeRef = useRef(null);
	const pausedDurationRef = useRef(0);
	const requestRef = useRef(null);

	const startFill = useCallback(() => {
		if (!disabled && !isActive) {
			console.log('Starting fill');
			setIsActive(true);
			setProgress(0);
			setIsCompleted(false);
			pausedDurationRef.current = 0;
			startTimeRef.current = null;
		}
	}, [disabled, isActive]);

	const resetButton = useCallback(() => {
		console.log('Resetting button');
		setIsActive(false);
		setProgress(0);
		setIsCompleted(false);
		setIsPaused(false);
		pausedDurationRef.current = 0;
		startTimeRef.current = null;
		pauseTimeRef.current = null;
	}, []);

	const togglePause = useCallback(() => {
		if (isActive && allowPause) {
			if (isPaused) {
				// Resuming - calculate total paused time
				if (pauseTimeRef.current) {
					pausedDurationRef.current +=
						performance.now() - pauseTimeRef.current;
				}
				console.log('Resuming');
			} else {
				pauseTimeRef.current = performance.now();
				console.log('Pausing');
			}
			setIsPaused(!isPaused);
		}
	}, [isActive, isPaused, allowPause]);

	// Auto-start effect
	useEffect(() => {
		if (autoStart && !disabled && !isActive && !isCompleted) {
			const timer = setTimeout(() => {
				startFill();
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [autoStart, disabled, isActive, isCompleted, startFill]);

	// Animation effect with improved pause/resume
	useEffect(() => {
		const animate = (timestamp) => {
			// Initialize start time on first frame
			if (!startTimeRef.current) {
				startTimeRef.current = timestamp;
			}

			// If paused, just keep the animation frame going but don't update progress
			if (isPaused) {
				requestRef.current = requestAnimationFrame(animate);
				return;
			}

			// Calculate elapsed time, accounting for paused duration
			const elapsed =
				timestamp - startTimeRef.current - pausedDurationRef.current;
			const newProgress = Math.min(elapsed / duration, 1);

			setProgress(newProgress);

			if (newProgress < 1) {
				requestRef.current = requestAnimationFrame(animate);
			} else {
				console.log('Animation completed');
				setIsCompleted(true);
				setIsActive(false);
				setIsPaused(false);
				onComplete();
			}
		};

		if (isActive && !isCompleted) {
			requestRef.current = requestAnimationFrame(animate);
		}

		return () => {
			if (requestRef.current) {
				cancelAnimationFrame(requestRef.current);
			}
		};
	}, [isActive, isPaused, duration, onComplete, isCompleted]);

	const getBackgroundClasses = () => {
		if (useGradient) {
			return {
				base: baseGradient || 'bg-gradient-to-r from-gray-100 to-gray-200',
				fill: fillGradient || 'bg-gradient-to-r from-gray-700 to-gray-900',
			};
		}
		return {
			base: baseColor,
			fill: fillColor,
		};
	};

	const bgClasses = getBackgroundClasses();

	const handleClick = () => {
		if (autoStart) {
			if (isActive && allowPause) {
				togglePause();
			} else if (isCompleted) {
				resetButton();
			}
		} else {
			if (isActive && allowPause) {
				togglePause();
			} else if (isActive) {
				resetButton();
			} else {
				startFill();
			}
		}
	};

	const getStatusText = () => {
		if (isCompleted) return 'Click to reset';
		if (isPaused) return 'Click to resume';
		if (isActive) return 'Click to pause';
		return 'Click to start';
	};

	return (
		<div
			className={`relative ${width} ${height} ${className} rounded-md cursor-pointer`}
		>
			{/* Main button with overflow hidden */}
			<div
				className="relative w-full h-full overflow-hidden rounded-md"
				onClick={handleClick}
			>
				<div
					className={`w-0 absolute ${fillColor} ${fillTextColor} h-full overflow-hidden`}
					style={{ width: `${progress * 100}%` }}
				>
					<div
						className={`${width} h-full flex justify-center items-center`}
					>
						{children}
					</div>
				</div>
				<div
					className={`${baseColor} ${baseTextColor} w-full h-full flex justify-center items-center`}
				>
					{children}
				</div>
			</div>

			{/* Status text - outside the overflow hidden container */}
			{showStatus && (
				<div className="mt-1 text-xs font-medium text-center w-full">
					<span
						className={`
            ${isPaused ? 'text-amber-600' : ''}
            ${isActive && !isPaused ? 'text-blue-600' : ''}
            ${isCompleted ? 'text-green-600' : ''}
            ${!isActive && !isCompleted ? 'text-gray-500' : ''}
          `}
					>
						{getStatusText()}
					</span>
				</div>
			)}
		</div>
	);
}
