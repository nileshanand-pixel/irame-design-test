export default function ProgressBar({ progress }) {
	return (
		<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
			<div
				className="h-2 bg-primary rounded-full transition-all duration-500"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
}
