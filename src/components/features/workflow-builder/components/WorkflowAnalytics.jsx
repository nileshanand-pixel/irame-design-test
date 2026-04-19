import { useState, useMemo } from 'react';
import {
	ArrowDownRight,
	ArrowUpRight,
	Minus,
	Calendar,
	ChevronDown,
	Search,
	TrendingUp,
	TrendingDown,
	AlertTriangle,
	Zap,
	Info,
	Filter,
	ArrowUpDown,
	Repeat2,
	BarChart3,
	ExternalLink,
	Loader2,
	Check,
	X,
} from 'lucide-react';
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getWorkflow } from '../lib/storage';
import { getAnalyticsData } from '../lib/mock-api';

/* ── constants ─────────────────────────────────────────── */

const DATE_PRESETS = [
	{ label: 'Last 7 days', value: '7d' },
	{ label: 'Last 30 days', value: '30d' },
	{ label: 'This quarter', value: 'quarter' },
	{ label: 'All time', value: 'all' },
];

const TYPE_CONFIG = {
	overpaid: {
		label: 'Overpaid',
		bg: 'bg-red-100',
		text: 'text-red-700',
		dot: 'bg-red-500',
		chartColor: '#DC2626',
	},
	underpaid: {
		label: 'Underpaid',
		bg: 'bg-orange-100',
		text: 'text-orange-700',
		dot: 'bg-orange-500',
		chartColor: '#D97300',
	},
	duplicate: {
		label: 'Duplicate',
		bg: 'bg-violet-100',
		text: 'text-violet-700',
		dot: 'bg-violet-500',
		chartColor: '#6d28d9',
	},
	unauthorized: {
		label: 'Unauthorized',
		bg: 'bg-rose-100',
		text: 'text-rose-700',
		dot: 'bg-rose-500',
		chartColor: '#E11D48',
	},
	missing: {
		label: 'Missing',
		bg: 'bg-amber-100',
		text: 'text-amber-700',
		dot: 'bg-amber-500',
		chartColor: '#B78900',
	},
};

const SORT_OPTIONS = [
	{ label: 'Variance (high first)', value: 'variance-desc' },
	{ label: 'Amount (high first)', value: 'amount-desc' },
	{ label: 'Most recent', value: 'recent' },
	{ label: 'Recurring first', value: 'recurring' },
];

const INSIGHT_STYLES = {
	critical: {
		border: 'border-l-red-500',
		icon: AlertTriangle,
		iconColor: 'text-red-500',
		bg: 'bg-red-50/60',
	},
	high: {
		border: 'border-l-orange-500',
		icon: AlertTriangle,
		iconColor: 'text-orange-500',
		bg: 'bg-orange-50/60',
	},
	medium: {
		border: 'border-l-amber-500',
		icon: AlertTriangle,
		iconColor: 'text-amber-500',
		bg: 'bg-amber-50/60',
	},
	info: {
		border: 'border-l-blue-500',
		icon: Info,
		iconColor: 'text-blue-500',
		bg: 'bg-blue-50/60',
	},
};

const TREND_CONFIG = {
	worsening: {
		label: 'Worsening',
		color: 'text-red-600',
		bg: 'bg-red-50',
		icon: TrendingUp,
	},
	stable: {
		label: 'Stable',
		color: 'text-amber-600',
		bg: 'bg-amber-50',
		icon: Minus,
	},
	improving: {
		label: 'Improving',
		color: 'text-emerald-600',
		bg: 'bg-emerald-50',
		icon: TrendingDown,
	},
};

/* ── helpers ────────────────────────────────────────────── */

function formatCurrency(val) {
	if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
	if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
	if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
	return `₹${val.toLocaleString('en-IN')}`;
}

function formatDate(iso) {
	const d = new Date(iso);
	return d.toLocaleDateString('en-IN', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

function formatTime(iso) {
	const d = new Date(iso);
	return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ── sub-components ─────────────────────────────────────── */

function KPICard({ label, value, unit, delta, polarity, icon: Icon }) {
	const isGood = polarity === 'positive' ? delta >= 0 : delta <= 0;
	const isNeutral = delta === 0;
	const DeltaIcon = isNeutral ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
	const deltaColor = isNeutral
		? 'text-slate-400'
		: isGood
			? 'text-emerald-600'
			: 'text-rose-600';
	const deltaBg = isNeutral
		? 'bg-slate-100'
		: isGood
			? 'bg-emerald-50'
			: 'bg-rose-50';

	return (
		<div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-1 min-w-0 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
			<div className="flex items-center gap-2 text-slate-400">
				{Icon && <Icon className="size-3.5 flex-shrink-0" />}
				<span className="text-[10px] font-bold uppercase tracking-widest truncate">
					{label}
				</span>
			</div>
			<div className="flex items-end gap-2 mt-1">
				<span className="text-2xl font-bold text-slate-900 leading-none">
					{value}
				</span>
				{unit && (
					<span className="text-xs text-slate-400 pb-0.5">{unit}</span>
				)}
			</div>
			<div
				className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full w-fit ${deltaBg} ${deltaColor}`}
			>
				<DeltaIcon className="size-3" />
				{Math.abs(delta)}% vs prev
			</div>
		</div>
	);
}

function TypeBadge({ type }) {
	const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.overpaid;
	return (
		<span
			className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${config.bg} ${config.text}`}
		>
			{config.label}
		</span>
	);
}

function ChartTooltipContent({ active, payload, label }) {
	if (!active || !payload?.length) return null;
	return (
		<div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
			<p className="text-xs font-semibold text-slate-700 mb-1">{label}</p>
			{payload.map((entry) => (
				<p key={entry.name} className="text-[11px] text-slate-500">
					<span style={{ color: entry.color }} className="font-semibold">
						{entry.name}:
					</span>{' '}
					{typeof entry.value === 'number' &&
					entry.name?.includes('Variance')
						? formatCurrency(entry.value * 100000)
						: entry.value}
				</p>
			))}
		</div>
	);
}

/* ── main component ─────────────────────────────────────── */

const WorkflowAnalytics = ({ workflowId, workflow: workflowProp, onBack }) => {
	const [datePreset, setDatePreset] = useState('all');
	const [showDateDropdown, setShowDateDropdown] = useState(false);
	const [typeFilter, setTypeFilter] = useState('all');
	const [sortBy, setSortBy] = useState('variance-desc');
	const [showSortDropdown, setShowSortDropdown] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedRunIds, setSelectedRunIds] = useState(new Set());
	const [showRunDropdown, setShowRunDropdown] = useState(false);
	const [expandedInsight, setExpandedInsight] = useState(null);

	const workflow = workflowProp || getWorkflow(workflowId);
	const data = useMemo(() => getAnalyticsData(workflowId), [workflowId]);

	// Derived: selected runs (default = all)
	const activeRunIds =
		selectedRunIds.size > 0
			? selectedRunIds
			: new Set(data.runs.map((r) => r.id));

	// Filtered + sorted anomalies
	const filteredAnomalies = useMemo(() => {
		let list = data.anomalies.filter((a) => activeRunIds.has(a.runId));
		if (typeFilter !== 'all') list = list.filter((a) => a.type === typeFilter);
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(a) =>
					a.entity.toLowerCase().includes(q) ||
					a.description.toLowerCase().includes(q),
			);
		}
		list.sort((a, b) => {
			switch (sortBy) {
				case 'variance-desc':
					return b.variance - a.variance;
				case 'amount-desc':
					return b.amount - a.amount;
				case 'recurring':
					return (
						(b.recurring ? b.occurrences : 0) -
						(a.recurring ? a.occurrences : 0)
					);
				case 'recent':
				default:
					return 0;
			}
		});
		return list;
	}, [data.anomalies, typeFilter, sortBy, searchQuery, activeRunIds]);

	// Filtered trend data
	const filteredTrend = useMemo(
		() => data.trendData.filter((t) => activeRunIds.has(t.runId)),
		[data.trendData, activeRunIds],
	);

	// Type counts for filter chips
	const typeCounts = useMemo(() => {
		const counts = {};
		data.anomalies
			.filter((a) => activeRunIds.has(a.runId))
			.forEach((a) => {
				counts[a.type] = (counts[a.type] || 0) + 1;
			});
		return counts;
	}, [data.anomalies, activeRunIds]);

	function toggleRun(runId) {
		setSelectedRunIds((prev) => {
			const next = new Set(prev);
			// If nothing selected yet, start fresh with just this one toggled off
			if (prev.size === 0) {
				data.runs.forEach((r) => {
					if (r.id !== runId) next.add(r.id);
				});
				return next;
			}
			if (next.has(runId)) next.delete(runId);
			else next.add(runId);
			// If all selected, clear to represent "all"
			if (next.size === data.runs.length) return new Set();
			return next;
		});
	}

	if (!workflow) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<Loader2 className="size-6 text-violet-700 animate-spin" />
			</div>
		);
	}

	const dateLabel =
		DATE_PRESETS.find((p) => p.value === datePreset)?.label ?? 'All time';

	const breakdownColors = ['#DC2626', '#6d28d9', '#E11D48', '#D97300'];

	return (
		<div className="flex flex-col min-h-0 space-y-5 relative">
			{/* ── Filter Strip ──────────────────────────────── */}
			<div className="flex items-center justify-between gap-3 flex-shrink-0">
				{/* Run chips */}
				<div className="flex items-center gap-2 overflow-x-auto scrollbar-hide min-w-0">
					<span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex-shrink-0">
						Comparing:
					</span>
					{data.runs
						.filter((r) => activeRunIds.has(r.id))
						.map((run) => (
							<span
								key={run.id}
								className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 flex-shrink-0"
							>
								<span className="size-1.5 rounded-full bg-emerald-500" />
								{run.id}
								<span className="text-slate-400 font-normal">
									{formatDate(run.date)}
								</span>
							</span>
						))}
				</div>

				<div className="flex items-center gap-2 flex-shrink-0">
					{/* Date Range Picker */}
					<div className="relative">
						<button
							onClick={() => {
								setShowDateDropdown((v) => !v);
								setShowRunDropdown(false);
								setShowSortDropdown(false);
							}}
							className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
						>
							<Calendar className="size-3.5 text-slate-400" />
							{dateLabel}
							<ChevronDown className="size-3 text-slate-400" />
						</button>
						{showDateDropdown && (
							<div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]">
								{DATE_PRESETS.map((preset) => (
									<button
										key={preset.value}
										onClick={() => {
											setDatePreset(preset.value);
											setShowDateDropdown(false);
										}}
										className={`w-full text-left px-3 py-2 text-xs transition-colors ${
											datePreset === preset.value
												? 'bg-violet-50 text-violet-700 font-semibold'
												: 'text-slate-700 hover:bg-slate-50'
										}`}
									>
										{preset.label}
									</button>
								))}
							</div>
						)}
					</div>

					{/* Run Filter */}
					<div className="relative">
						<button
							onClick={() => {
								setShowRunDropdown((v) => !v);
								setShowDateDropdown(false);
								setShowSortDropdown(false);
							}}
							className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
						>
							<Filter className="size-3.5 text-slate-400" />
							{selectedRunIds.size > 0
								? `${selectedRunIds.size} runs`
								: `All runs (${data.runs.length})`}
							<ChevronDown className="size-3 text-slate-400" />
						</button>
						{showRunDropdown && (
							<div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[220px]">
								{data.runs.map((run) => {
									const isActive = activeRunIds.has(run.id);
									return (
										<button
											key={run.id}
											onClick={() => toggleRun(run.id)}
											className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
										>
											<span
												className={`size-4 rounded border flex items-center justify-center flex-shrink-0 ${
													isActive
														? 'bg-violet-700 border-violet-700'
														: 'border-slate-300 bg-white'
												}`}
											>
												{isActive && (
													<Check className="size-3 text-white" />
												)}
											</span>
											<span className="font-mono font-semibold">
												{run.id}
											</span>
											<span className="text-slate-400 ml-auto">
												{formatDate(run.date)}
											</span>
										</button>
									);
								})}
								{selectedRunIds.size > 0 && (
									<button
										onClick={() => setSelectedRunIds(new Set())}
										className="w-full text-left px-3 py-2 text-xs text-violet-700 font-semibold hover:bg-slate-50 border-t border-slate-100 mt-1"
									>
										Reset to all
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ── Content ───────────────────────────────────── */}
			<div className="space-y-5">
				{/* ── KPI Cards + AI Insights ────────────────── */}
				<div className="grid grid-cols-12 gap-4">
					<div className="col-span-8 grid grid-cols-4 gap-3">
						<KPICard
							label="Total Anomalies"
							value={data.kpis.totalAnomalies.value}
							delta={data.kpis.totalAnomalies.delta}
							polarity={data.kpis.totalAnomalies.polarity}
							icon={AlertTriangle}
						/>
						<KPICard
							label="Total Variance"
							value={formatCurrency(data.kpis.totalVariance.value)}
							delta={data.kpis.totalVariance.delta}
							polarity={data.kpis.totalVariance.polarity}
							icon={BarChart3}
						/>
						<KPICard
							label="Avg Confidence"
							value={`${data.kpis.avgConfidence.value}%`}
							delta={data.kpis.avgConfidence.delta}
							polarity={data.kpis.avgConfidence.polarity}
							icon={TrendingUp}
						/>
						<KPICard
							label="Resolution Rate"
							value={`${data.kpis.resolutionRate.value}%`}
							delta={data.kpis.resolutionRate.delta}
							polarity={data.kpis.resolutionRate.polarity}
							icon={Check}
						/>
					</div>

					{/* AI Insights Panel */}
					<div className="col-span-4 bg-gradient-to-br from-violet-700 to-violet-950 rounded-2xl p-4 text-white relative overflow-hidden">
						<div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
						<div className="flex items-center gap-2 mb-3">
							<Zap className="size-4" />
							<span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
								AI Insights
							</span>
						</div>
						<div className="space-y-2.5">
							{data.aiInsights.map((insight, i) => (
								<button
									key={i}
									onClick={() =>
										setExpandedInsight(
											expandedInsight === i ? null : i,
										)
									}
									className="w-full text-left"
								>
									<div className="flex items-start gap-2">
										<span
											className={`size-1.5 rounded-full flex-shrink-0 mt-1.5 ${
												insight.severity === 'critical'
													? 'bg-red-400'
													: insight.severity === 'high'
														? 'bg-orange-400'
														: 'bg-blue-400'
											}`}
										/>
										<div className="min-w-0">
											<p
												className={`text-xs font-medium leading-snug ${expandedInsight === i ? '' : 'line-clamp-1'}`}
											>
												{insight.title}
											</p>
											{expandedInsight === i && (
												<p className="text-[11px] text-white/70 mt-1 leading-relaxed">
													{insight.description}
												</p>
											)}
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				</div>

				{/* ── Charts Row ─────────────────────────────── */}
				<div className="grid grid-cols-12 gap-4">
					{/* Anomaly Trend */}
					<div className="col-span-7 bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)] p-5">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="text-sm font-semibold text-slate-900">
									Anomaly Trend
								</h3>
								<p className="text-[11px] text-slate-400 mt-0.5">
									Anomalies & variance across runs
								</p>
							</div>
						</div>
						<ResponsiveContainer width="100%" height={220}>
							<AreaChart
								data={filteredTrend}
								margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
							>
								<defs>
									<linearGradient
										id="anomalyGradient"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="#6d28d9"
											stopOpacity={0.2}
										/>
										<stop
											offset="95%"
											stopColor="#6d28d9"
											stopOpacity={0}
										/>
									</linearGradient>
									<linearGradient
										id="varianceGradient"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="#DC2626"
											stopOpacity={0.15}
										/>
										<stop
											offset="95%"
											stopColor="#DC2626"
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="rgba(38,6,74,0.06)"
								/>
								<XAxis
									dataKey="label"
									tick={{
										fontSize: 11,
										fill: 'rgba(38,6,74,0.4)',
									}}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									yAxisId="left"
									tick={{
										fontSize: 11,
										fill: 'rgba(38,6,74,0.4)',
									}}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									yAxisId="right"
									orientation="right"
									tick={{
										fontSize: 11,
										fill: 'rgba(38,6,74,0.4)',
									}}
									axisLine={false}
									tickLine={false}
									unit="L"
								/>
								<Tooltip content={<ChartTooltipContent />} />
								<Area
									yAxisId="left"
									type="monotone"
									dataKey="anomalies"
									name="Anomalies"
									stroke="#6d28d9"
									strokeWidth={2}
									fill="url(#anomalyGradient)"
									dot={{
										fill: '#6d28d9',
										r: 4,
										strokeWidth: 2,
										stroke: '#fff',
									}}
									activeDot={{
										r: 6,
										strokeWidth: 2,
										stroke: '#fff',
									}}
								/>
								<Area
									yAxisId="right"
									type="monotone"
									dataKey="variance"
									name="Variance (₹L)"
									stroke="#DC2626"
									strokeWidth={2}
									strokeDasharray="5 3"
									fill="url(#varianceGradient)"
									dot={{
										fill: '#DC2626',
										r: 3,
										strokeWidth: 2,
										stroke: '#fff',
									}}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>

					{/* Anomaly Breakdown */}
					<div className="col-span-5 bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)] p-5">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="text-sm font-semibold text-slate-900">
									Breakdown by Type
								</h3>
								<p className="text-[11px] text-slate-400 mt-0.5">
									Distribution across anomaly categories
								</p>
							</div>
						</div>
						<ResponsiveContainer width="100%" height={220}>
							<BarChart
								data={data.breakdownData}
								layout="vertical"
								margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="rgba(38,6,74,0.06)"
									horizontal={false}
								/>
								<XAxis
									type="number"
									tick={{
										fontSize: 11,
										fill: 'rgba(38,6,74,0.4)',
									}}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									dataKey="type"
									type="category"
									tick={{
										fontSize: 11,
										fill: 'rgba(38,6,74,0.8)',
										fontWeight: 500,
									}}
									axisLine={false}
									tickLine={false}
									width={90}
								/>
								<Tooltip content={<ChartTooltipContent />} />
								<Bar
									dataKey="count"
									name="Count"
									radius={[0, 6, 6, 0]}
									barSize={24}
								>
									{data.breakdownData.map((entry, idx) => (
										<Cell
											key={entry.type}
											fill={
												breakdownColors[
													idx % breakdownColors.length
												]
											}
											fillOpacity={0.85}
										/>
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* ── Anomaly Table ──────────────────────────── */}
				<div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)] overflow-hidden">
					{/* Table header / filters */}
					<div className="px-5 py-4 border-b border-slate-200">
						<div className="flex items-center justify-between gap-3 mb-3">
							<h3 className="text-sm font-semibold text-slate-900">
								Anomaly Details
								<span className="text-slate-400 font-normal ml-1.5">
									({filteredAnomalies.length})
								</span>
							</h3>
							<div className="flex items-center gap-2">
								{/* Search */}
								<div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
									<Search className="size-3.5 text-slate-400" />
									<input
										type="text"
										value={searchQuery}
										onChange={(e) =>
											setSearchQuery(e.target.value)
										}
										placeholder="Search entity..."
										className="text-xs text-slate-700 bg-transparent outline-none w-32 placeholder:text-slate-300"
									/>
									{searchQuery && (
										<button onClick={() => setSearchQuery('')}>
											<X className="size-3 text-slate-400 hover:text-slate-700" />
										</button>
									)}
								</div>

								{/* Sort */}
								<div className="relative">
									<button
										onClick={() => {
											setShowSortDropdown((v) => !v);
											setShowDateDropdown(false);
											setShowRunDropdown(false);
										}}
										className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
									>
										<ArrowUpDown className="size-3" />
										Sort
									</button>
									{showSortDropdown && (
										<div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px]">
											{SORT_OPTIONS.map((opt) => (
												<button
													key={opt.value}
													onClick={() => {
														setSortBy(opt.value);
														setShowSortDropdown(false);
													}}
													className={`w-full text-left px-3 py-2 text-xs transition-colors ${
														sortBy === opt.value
															? 'bg-violet-50 text-violet-700 font-semibold'
															: 'text-slate-700 hover:bg-slate-50'
													}`}
												>
													{opt.label}
												</button>
											))}
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Type filter chips */}
						<div className="flex items-center gap-1.5 flex-wrap">
							<button
								onClick={() => setTypeFilter('all')}
								className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
									typeFilter === 'all'
										? 'bg-violet-100 text-violet-700 border-violet-200'
										: 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
								}`}
							>
								All (
								{
									data.anomalies.filter((a) =>
										activeRunIds.has(a.runId),
									).length
								}
								)
							</button>
							{Object.entries(TYPE_CONFIG).map(([key, config]) => {
								const count = typeCounts[key] || 0;
								if (!count) return null;
								return (
									<button
										key={key}
										onClick={() =>
											setTypeFilter(
												typeFilter === key ? 'all' : key,
											)
										}
										className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
											typeFilter === key
												? `${config.bg} ${config.text} border-current/20`
												: 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
										}`}
									>
										<span
											className={`size-1.5 rounded-full ${config.dot}`}
										/>
										{config.label} ({count})
									</button>
								);
							})}
						</div>
					</div>

					{/* Table body */}
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-slate-50/50">
									{[
										'Entity',
										'Type',
										'Amount',
										'Variance',
										'Run',
										'Recurring',
										'Action',
									].map((h) => (
										<th
											key={h}
											className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-slate-200"
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{filteredAnomalies.map((anomaly) => (
									<tr
										key={anomaly.id}
										className="hover:bg-slate-50 transition-colors group"
									>
										<td className="px-4 py-3">
											<p className="text-xs font-semibold text-slate-900">
												{anomaly.entity}
											</p>
											<p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
												{anomaly.description}
											</p>
										</td>
										<td className="px-4 py-3">
											<TypeBadge type={anomaly.type} />
										</td>
										<td className="px-4 py-3 text-xs font-semibold text-slate-900 whitespace-nowrap">
											{formatCurrency(anomaly.amount)}
										</td>
										<td className="px-4 py-3">
											<span
												className={`text-xs font-semibold ${anomaly.variance >= 50 ? 'text-red-600' : anomaly.variance >= 10 ? 'text-orange-600' : 'text-amber-600'}`}
											>
												<TrendingUp className="size-3 inline mr-0.5 -mt-0.5" />
												{anomaly.variance}%
											</span>
										</td>
										<td className="px-4 py-3">
											<span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded">
												{anomaly.runId}
											</span>
										</td>
										<td className="px-4 py-3">
											{anomaly.recurring ? (
												<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
													<Repeat2 className="size-3" />
													{anomaly.occurrences}x
												</span>
											) : (
												<span className="text-[11px] text-slate-300">
													—
												</span>
											)}
										</td>
										<td className="px-4 py-3">
											<button className="text-xs font-semibold text-violet-700 hover:text-violet-800 transition-colors opacity-60 group-hover:opacity-100 flex items-center gap-1">
												Investigate
												<ExternalLink className="size-3" />
											</button>
										</td>
									</tr>
								))}
								{filteredAnomalies.length === 0 && (
									<tr>
										<td
											colSpan={7}
											className="px-4 py-8 text-center text-xs text-slate-400"
										>
											No anomalies match your filters.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* ── Bottom Row: Recurring Patterns + Variance ── */}
				<div className="grid grid-cols-12 gap-4">
					{/* Recurring Patterns */}
					<div className="col-span-5 bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)] p-5">
						<div className="flex items-center gap-2 mb-4">
							<Repeat2 className="size-4 text-violet-700" />
							<h3 className="text-sm font-semibold text-slate-900">
								Recurring Patterns
							</h3>
						</div>
						<div className="space-y-3">
							{data.recurringPatterns.map((pattern, i) => {
								const trend =
									TREND_CONFIG[pattern.trend] ??
									TREND_CONFIG.stable;
								const TrendIcon = trend.icon;
								return (
									<div
										key={i}
										className="bg-slate-50 border border-slate-200 rounded-xl p-3.5"
									>
										<div className="flex items-center justify-between mb-1.5">
											<p className="text-xs font-semibold text-slate-900">
												{pattern.entity}
											</p>
											<span
												className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${trend.bg} ${trend.color}`}
											>
												<TrendIcon className="size-3" />
												{trend.label}
											</span>
										</div>
										<p className="text-[11px] text-slate-500 mb-2">
											{pattern.issue}
										</p>
										<div className="flex items-center gap-3 text-[11px]">
											<span className="text-slate-400">
												<span className="font-semibold text-slate-700">
													{pattern.frequency}
												</span>{' '}
												runs
											</span>
											<span className="text-slate-300">|</span>
											<span className="text-slate-400">
												Exposure:{' '}
												<span className="font-semibold text-red-600">
													{formatCurrency(
														pattern.cumulativeExposure,
													)}
												</span>
											</span>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Approved vs Actual Variance */}
					<div className="col-span-7 bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)] p-5">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="text-sm font-semibold text-slate-900">
									Approved vs Actual Amount
								</h3>
								<p className="text-[11px] text-slate-400 mt-0.5">
									Column-level deviance across runs
								</p>
							</div>
						</div>
						<ResponsiveContainer width="100%" height={240}>
							<LineChart
								data={data.varianceTrend}
								margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="rgba(38,6,74,0.06)"
								/>
								<XAxis
									dataKey="label"
									tick={{
										fontSize: 11,
										fill: 'rgba(38,6,74,0.4)',
									}}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={{
										fontSize: 11,
										fill: 'rgba(38,6,74,0.4)',
									}}
									axisLine={false}
									tickLine={false}
									tickFormatter={(v) =>
										`₹${(v / 100000).toFixed(1)}L`
									}
								/>
								<Tooltip
									content={({ active, payload, label }) => {
										if (!active || !payload?.length) return null;
										return (
											<div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
												<p className="text-xs font-semibold text-slate-700 mb-1">
													{label}
												</p>
												{payload.map((entry) => (
													<p
														key={entry.name}
														className="text-[11px] text-slate-500"
													>
														<span
															style={{
																color: entry.color,
															}}
															className="font-semibold"
														>
															{entry.name}:
														</span>{' '}
														{formatCurrency(entry.value)}
													</p>
												))}
											</div>
										);
									}}
								/>
								<Line
									type="monotone"
									dataKey="approved"
									name="Approved"
									stroke="#6d28d9"
									strokeWidth={2}
									dot={{
										fill: '#6d28d9',
										r: 4,
										strokeWidth: 2,
										stroke: '#fff',
									}}
								/>
								<Line
									type="monotone"
									dataKey="actual"
									name="Actual"
									stroke="#DC2626"
									strokeWidth={2}
									strokeDasharray="5 3"
									dot={{
										fill: '#DC2626',
										r: 4,
										strokeWidth: 2,
										stroke: '#fff',
									}}
								/>
							</LineChart>
						</ResponsiveContainer>
						{/* Legend */}
						<div className="flex items-center justify-center gap-6 mt-2">
							<span className="flex items-center gap-1.5 text-[11px] text-slate-500">
								<span className="w-4 h-0.5 bg-[#6d28d9] rounded-full" />{' '}
								Approved
							</span>
							<span className="flex items-center gap-1.5 text-[11px] text-slate-500">
								<span
									className="w-4 h-0.5 bg-[#DC2626] rounded-full border-dashed"
									style={{
										borderTop: '2px dashed #DC2626',
										height: 0,
										background: 'none',
									}}
								/>{' '}
								Actual
							</span>
						</div>
					</div>
				</div>

				{/* Bottom spacing */}
				<div className="h-2" />
			</div>

			{/* Click-away overlay for dropdowns */}
			{(showDateDropdown || showRunDropdown || showSortDropdown) && (
				<div
					className="fixed inset-0 z-10"
					onClick={() => {
						setShowDateDropdown(false);
						setShowRunDropdown(false);
						setShowSortDropdown(false);
					}}
				/>
			)}
		</div>
	);
};

export default WorkflowAnalytics;
