const BASE_URL = import.meta.env.VITE_STAGE_BASE_URL || '';

const resolveReportUrl = (url) => {
	if (!url) return url;
	// Absolute URLs (S3 presigned) — use as-is
	if (url.startsWith('http://') || url.startsWith('https://')) return url;
	// Relative paths (local dev) — prepend BE base URL
	return `${BASE_URL}${url}`;
};

const ResultsSection = ({ result, fileNames, onNewAnalysis, onViewReport }) => {
	const reportUrls = result?.report_urls || {};
	const evidenceUrls = result?.evidence_urls || [];
	const summary = result?.summary;

	const reportTypes = [
		{
			key: 'understanding',
			label: 'Data Understanding',
			description: 'Schema, distributions, and data quality overview',
			icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
		},
		{
			key: 'anomaly',
			label: 'Anomaly Detection',
			description: 'Statistical outliers, Z-scores, and Benford analysis',
			icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
		},
		{
			key: 'heuristic',
			label: 'Heuristic Analysis',
			description:
				'Business rules, patterns, and feature engineering insights',
			icon: 'M13 10V3L4 14h7v7l9-11h-7z',
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold text-primary80">
						Analysis Complete
					</h3>
					<p className="text-sm text-primary40 mt-0.5">
						{fileNames?.join(', ')}
					</p>
				</div>
				<button
					onClick={onNewAnalysis}
					className="px-4 py-2 text-sm font-medium border border-purple-100 text-purple-100 rounded-lg hover:bg-purple-4 transition-colors"
				>
					New Analysis
				</button>
			</div>

			{summary && (
				<div className="bg-purple-4 rounded-lg p-4">
					<h4 className="text-sm font-medium text-primary80 mb-2">
						Summary
					</h4>
					<div className="grid grid-cols-3 gap-4 text-sm">
						{summary.total_rows != null && (
							<div>
								<span className="text-primary40">Total Rows</span>
								<p className="font-medium text-primary80">
									{summary.total_rows?.toLocaleString()}
								</p>
							</div>
						)}
						{summary.total_columns != null && (
							<div>
								<span className="text-primary40">Total Columns</span>
								<p className="font-medium text-primary80">
									{summary.total_columns}
								</p>
							</div>
						)}
						{summary.files_analyzed != null && (
							<div>
								<span className="text-primary40">
									Files Analyzed
								</span>
								<p className="font-medium text-primary80">
									{summary.files_analyzed}
								</p>
							</div>
						)}
					</div>
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{reportTypes.map(({ key, label, description, icon }) => {
					const rawUrl =
						reportUrls[key + '_standalone'] || reportUrls[key];
					const url = resolveReportUrl(rawUrl);
					const hasReport = !!url;

					return (
						<div
							key={key}
							className={`border rounded-xl p-5 transition-colors ${
								hasReport
									? 'hover:border-purple-40 cursor-pointer'
									: 'opacity-50'
							}`}
							onClick={() => hasReport && onViewReport?.(key)}
						>
							<div className="flex items-start gap-3">
								<div className="w-10 h-10 rounded-lg bg-purple-4 flex items-center justify-center shrink-0">
									<svg
										className="w-5 h-5 text-purple-100"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1.5}
											d={icon}
										/>
									</svg>
								</div>
								<div>
									<h4 className="text-sm font-medium text-primary80">
										{label}
									</h4>
									<p className="text-xs text-primary40 mt-0.5">
										{description}
									</p>
								</div>
							</div>
							{hasReport ? (
								<p className="text-xs text-purple-100 font-medium mt-3">
									View Report &rarr;
								</p>
							) : (
								<p className="text-xs text-primary40 mt-3">
									Not available
								</p>
							)}
						</div>
					);
				})}
			</div>

			{evidenceUrls.length > 0 && (
				<div>
					<h4 className="text-sm font-medium text-primary60 mb-2">
						Evidence Files
					</h4>
					<div className="flex flex-wrap gap-2">
						{evidenceUrls.map((url, i) => {
							const fileName = url.split('/').pop();
							return (
								<a
									key={i}
									href={url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-primary60 font-medium transition-colors"
								>
									<svg
										className="w-3.5 h-3.5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
									{fileName}
								</a>
							);
						})}
					</div>
				</div>
			)}

			{result?.llm_cost_usd != null && result.llm_cost_usd > 0 && (
				<p className="text-xs text-primary40 text-right">
					LLM cost: ${result.llm_cost_usd.toFixed(4)}
				</p>
			)}
		</div>
	);
};

export default ResultsSection;
