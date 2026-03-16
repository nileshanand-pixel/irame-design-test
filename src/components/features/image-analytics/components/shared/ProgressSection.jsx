import { useState, useEffect, useRef } from 'react';

const ProgressSection = ({ statusData, fileNames, onCancel }) => {
	const [elapsed, setElapsed] = useState(0);
	const [activityLog, setActivityLog] = useState([]);
	const startTimeRef = useRef(Date.now());
	const logEndRef = useRef(null);

	useEffect(() => {
		const timer = setInterval(() => {
			setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		if (statusData?.message) {
			setActivityLog((prev) => {
				const last = prev[prev.length - 1];
				if (last?.message === statusData.message) return prev;
				return [
					...prev,
					{
						time: new Date().toLocaleTimeString(),
						stage: statusData.stage,
						message: statusData.message,
					},
				];
			});
		}
	}, [statusData?.message, statusData?.stage]);

	useEffect(() => {
		logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [activityLog]);

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	};

	const progressPercent = statusData?.progressPercent || 0;

	return (
		<div className="space-y-6">
			{fileNames?.length > 0 && (
				<div className="flex items-center gap-2 text-sm">
					<svg
						className="w-4 h-4 text-primary40 shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<span className="text-primary60">Analyzing:</span>
					<span className="text-primary80 font-medium truncate">
						{fileNames.join(', ')}
					</span>
				</div>
			)}

			<div className="space-y-2">
				<div className="flex justify-between text-sm">
					<span className="text-primary60 font-medium">
						{statusData?.message || 'Processing...'}
					</span>
					<span className="text-primary40">{formatTime(elapsed)}</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2.5">
					<div
						className="bg-purple-100 h-2.5 rounded-full transition-all duration-500"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
				<div className="flex justify-between text-xs text-primary40">
					<span>{progressPercent}%</span>
					<span>Elapsed: {formatTime(elapsed)}</span>
				</div>
			</div>

			<div className="flex items-center justify-between">
				<p className="text-xs text-primary40">
					You can close this page and come back later. Your analysis will
					be saved automatically.
				</p>
				{onCancel && (
					<button
						onClick={onCancel}
						className="px-4 py-1.5 text-sm border border-red-300 text-red-500 rounded-lg hover:bg-red-50 font-medium transition-colors"
					>
						Cancel
					</button>
				)}
			</div>

			{activityLog.length > 0 && (
				<div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
					<h4 className="text-xs font-medium text-primary40 mb-2">
						Activity Log
					</h4>
					<div className="space-y-1">
						{activityLog.map((entry, i) => (
							<div key={i} className="flex gap-2 text-xs">
								<span className="text-primary40 shrink-0">
									{entry.time}
								</span>
								<span className="text-primary60 font-medium shrink-0">
									[{entry.stage}]
								</span>
								<span className="text-primary80">
									{entry.message}
								</span>
							</div>
						))}
						<div ref={logEndRef} />
					</div>
				</div>
			)}
		</div>
	);
};

export default ProgressSection;
