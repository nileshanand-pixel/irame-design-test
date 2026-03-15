import { BarChart3 } from 'lucide-react';

const EDAHeader = () => {
	return (
		<div className="bg-purple-100 px-6 py-4">
			<div className="flex items-center gap-3">
				<BarChart3 className="w-5 h-5 text-white/90" />
				<div>
					<h1 className="text-lg font-semibold text-white uppercase tracking-wide">
						EDA Builder
					</h1>
					<p className="text-xs text-white/60 mt-0.5">
						Automated statistical profiling, anomaly detection, and
						heuristic reports
					</p>
				</div>
			</div>
		</div>
	);
};

export default EDAHeader;
