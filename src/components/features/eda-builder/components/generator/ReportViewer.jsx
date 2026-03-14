import { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getEdaReportHtml } from '../../service/eda.service';

const REPORT_TYPES = [
	{
		key: 'understanding',
		label: 'Data Understanding',
		icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
	},
	{
		key: 'anomaly',
		label: 'Anomaly Detection',
		icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
	},
	{
		key: 'heuristic',
		label: 'Heuristic Analysis',
		icon: 'M13 10V3L4 14h7v7l9-11h-7z',
	},
];

const ReportViewer = ({ jobId, reportUrls, summary, initialTab }) => {
	const [activeTab, setActiveTab] = useState(initialTab || '');
	const [htmlCache, setHtmlCache] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [statsOpen, setStatsOpen] = useState(false);
	const iframeRef = useRef(null);

	const availableReports = REPORT_TYPES.filter(
		(r) => reportUrls?.[r.key] || reportUrls?.[r.key + '_standalone'],
	);

	// Set initial tab if provided, or auto-select first available report
	useEffect(() => {
		if (initialTab && initialTab !== activeTab) {
			setActiveTab(initialTab);
		} else if (!activeTab && availableReports.length > 0) {
			setActiveTab(availableReports[0].key);
		}
	}, [initialTab, availableReports.length]);

	const fetchReport = useCallback(
		async (reportKey) => {
			if (htmlCache[reportKey]) return;
			setLoading(true);
			setError('');
			try {
				// Try standalone first, then regular
				const type = reportUrls?.[reportKey + '_standalone']
					? reportKey + '_standalone'
					: reportKey;
				const html = await getEdaReportHtml(jobId, type);
				setHtmlCache((prev) => ({ ...prev, [reportKey]: html }));
			} catch (err) {
				setError(
					`Failed to load ${reportKey} report: ${err?.response?.status === 404 ? 'Report not found' : err.message}`,
				);
			} finally {
				setLoading(false);
			}
		},
		[jobId, reportUrls, htmlCache],
	);

	// Fetch when tab changes
	useEffect(() => {
		if (activeTab) {
			fetchReport(activeTab);
		}
	}, [activeTab, fetchReport]);

	// Resize iframe to fit content
	const handleIframeLoad = useCallback(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;
		try {
			const doc = iframe.contentDocument || iframe.contentWindow?.document;
			if (doc?.body) {
				const height = Math.max(doc.body.scrollHeight, 600);
				iframe.style.height = `${Math.min(height, 2000)}px`;
			}
		} catch {
			// Cross-origin or access error — use default height
		}
	}, []);

	const handleDownload = () => {
		const html = htmlCache[activeTab];
		if (!html) return;
		const blob = new Blob([html], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${activeTab}-report.html`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const llmCosts = summary?.llm_costs || {};
	const hasStats =
		llmCosts &&
		(llmCosts.total_cost != null ||
			llmCosts.total_input_tokens != null ||
			llmCosts.calls != null);

	if (availableReports.length === 0) return null;

	return (
		<div className="mt-6 border border-gray-200/80 rounded-xl overflow-hidden shadow-sm">
			{/* Header */}
			<div className="px-5 py-3.5 border-b bg-gradient-to-r from-purple-4 to-indigo-50/50 flex items-center justify-between">
				<div className="flex items-center gap-2.5">
					<div className="w-7 h-7 rounded-lg bg-purple-100/10 flex items-center justify-center">
						<svg
							className="w-4 h-4 text-purple-100"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<h3 className="text-sm font-semibold text-primary80">
						Report Viewer
					</h3>
				</div>
				{activeTab && htmlCache[activeTab] && (
					<button
						onClick={handleDownload}
						className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-purple-100 bg-white border border-purple-100/30 rounded-lg hover:bg-purple-100 hover:text-white transition-all duration-200 shadow-sm"
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
						Download HTML
					</button>
				)}
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<div className="px-5 pt-2 pb-0 border-b bg-gray-50/50">
					<TabsList className="bg-transparent gap-2 p-0 h-auto">
						{availableReports.map(({ key, label, icon }) => (
							<TabsTrigger
								key={key}
								value={key}
								className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary40 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-purple-100 data-[state=active]:text-purple-100 data-[state=active]:bg-white data-[state=active]:shadow-sm hover:text-primary60 hover:bg-white/60 transition-all duration-200 -mb-[1px]"
							>
								<svg
									className="w-4 h-4"
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
								{label}
							</TabsTrigger>
						))}
					</TabsList>
				</div>

				{/* Content */}
				{availableReports.map(({ key }) => (
					<TabsContent key={key} value={key} className="mt-0">
						{loading && !htmlCache[key] ? (
							<div className="flex items-center justify-center py-20 bg-gray-50/30">
								<div className="text-center space-y-3">
									<div className="animate-spin w-8 h-8 border-2 border-purple-100 border-t-transparent rounded-full mx-auto" />
									<p className="text-sm text-primary40">
										Loading report...
									</p>
								</div>
							</div>
						) : error && !htmlCache[key] ? (
							<div className="flex items-center justify-center py-20 bg-red-50/20">
								<div className="text-center space-y-3">
									<svg
										className="w-10 h-10 text-red-400 mx-auto"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1.5}
											d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<p className="text-sm text-red-500">{error}</p>
									<button
										onClick={() => {
											setError('');
											fetchReport(key);
										}}
										className="text-xs text-purple-100 hover:underline"
									>
										Retry
									</button>
								</div>
							</div>
						) : htmlCache[key] ? (
							<div className="bg-white">
								<iframe
									ref={iframeRef}
									srcDoc={htmlCache[key]}
									onLoad={handleIframeLoad}
									title={`${key} report`}
									className="w-full border-0"
									style={{ minHeight: '600px', height: '800px' }}
									sandbox="allow-scripts allow-same-origin"
								/>
							</div>
						) : null}
					</TabsContent>
				))}

				{/* No tab selected state */}
				{!activeTab && (
					<div className="flex items-center justify-center py-20 bg-gray-50/30">
						<div className="text-center space-y-2">
							<svg
								className="w-10 h-10 text-primary20 mx-auto"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<p className="text-sm text-primary40">
								Select a report tab above to view
							</p>
						</div>
					</div>
				)}
			</Tabs>

			{/* Pipeline & LLM Stats */}
			{hasStats && (
				<div className="border-t border-gray-100">
					<button
						onClick={() => setStatsOpen(!statsOpen)}
						className="w-full px-5 py-3 flex items-center justify-between text-sm text-primary40 hover:text-primary60 hover:bg-gray-50/50 transition-all duration-200"
					>
						<div className="flex items-center gap-2">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
							<span className="font-medium">
								Pipeline &amp; LLM Stats
							</span>
						</div>
						<svg
							className={`w-4 h-4 transition-transform duration-200 ${statsOpen ? 'rotate-180' : ''}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
					{statsOpen && (
						<div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
							{llmCosts.total_cost != null && (
								<StatCard
									label="Total LLM Cost"
									value={`$${Number(llmCosts.total_cost).toFixed(4)}`}
								/>
							)}
							{llmCosts.total_input_tokens != null && (
								<StatCard
									label="Input Tokens"
									value={Number(
										llmCosts.total_input_tokens,
									).toLocaleString()}
								/>
							)}
							{llmCosts.total_output_tokens != null && (
								<StatCard
									label="Output Tokens"
									value={Number(
										llmCosts.total_output_tokens,
									).toLocaleString()}
								/>
							)}
							{llmCosts.calls != null && (
								<StatCard label="LLM Calls" value={llmCosts.calls} />
							)}
							{llmCosts.provider && (
								<StatCard
									label="Provider"
									value={llmCosts.provider}
								/>
							)}
							{llmCosts.model && (
								<StatCard label="Model" value={llmCosts.model} />
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

const StatCard = ({ label, value }) => (
	<div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
		<p className="text-xs text-primary40">{label}</p>
		<p className="text-sm font-semibold text-primary80 mt-0.5">{value}</p>
	</div>
);

export default ReportViewer;
