import { useState, Fragment } from 'react';
import {
	ShieldCheck,
	ShieldAlert,
	ChevronDown,
	ChevronRight,
	Plus,
	Check,
	X,
	AlertTriangle,
	Search,
	Link2,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────

const RATING_CONFIG = {
	Critical: {
		bg: 'bg-red-50',
		text: 'text-red-700',
		border: 'border-red-200',
		dot: 'bg-red-500',
	},
	High: {
		bg: 'bg-orange-50',
		text: 'text-orange-700',
		border: 'border-orange-200',
		dot: 'bg-orange-500',
	},
	Medium: {
		bg: 'bg-amber-50',
		text: 'text-amber-700',
		border: 'border-amber-200',
		dot: 'bg-amber-500',
	},
	Low: {
		bg: 'bg-emerald-50',
		text: 'text-emerald-700',
		border: 'border-emerald-200',
		dot: 'bg-emerald-500',
	},
};

const EFFECTIVENESS_CONFIG = {
	effective: {
		label: 'Effective',
		bg: 'bg-emerald-50',
		text: 'text-emerald-700',
		icon: Check,
	},
	needs_improvement: {
		label: 'Needs Improvement',
		bg: 'bg-amber-50',
		text: 'text-amber-700',
		icon: AlertTriangle,
	},
	ineffective: {
		label: 'Ineffective',
		bg: 'bg-red-50',
		text: 'text-red-700',
		icon: X,
	},
};

const CONTROL_TYPE_STYLE = {
	Preventive: 'bg-blue-50 text-blue-700',
	Detective: 'bg-violet-50 text-violet-700',
	Corrective: 'bg-rose-50 text-rose-700',
};

// ── Sub-components ─────────────────────────────────────────────

function RatingBadge({ rating }) {
	const cfg = RATING_CONFIG[rating] || RATING_CONFIG.Medium;
	return (
		<span
			className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}
		>
			<span className={`size-1.5 rounded-full ${cfg.dot}`} />
			{rating}
		</span>
	);
}

function EffectivenessBadge({ effectiveness }) {
	const cfg =
		EFFECTIVENESS_CONFIG[effectiveness] || EFFECTIVENESS_CONFIG.effective;
	const Icon = cfg.icon;
	return (
		<span
			className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bg} ${cfg.text}`}
		>
			<Icon className="size-2.5" strokeWidth={2.5} />
			{cfg.label}
		</span>
	);
}

function AssertionPills({ assertions }) {
	return (
		<div className="flex flex-wrap gap-1">
			{assertions.map((a) => (
				<span
					key={a}
					className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500 uppercase tracking-wide"
				>
					{a[0]}
				</span>
			))}
		</div>
	);
}

function ControlCard({ control }) {
	const typeStyle =
		CONTROL_TYPE_STYLE[control.type] || 'bg-slate-50 text-slate-600';
	return (
		<div className="ml-4 pl-3 border-l-2 border-violet-200 py-2 group/ctrl">
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1.5 mb-1">
						<span
							className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${typeStyle}`}
						>
							{control.type}
						</span>
						<span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-50 text-slate-500">
							{control.nature}
						</span>
					</div>
					<p className="text-[11px] text-slate-700 leading-relaxed">
						{control.activity}
					</p>
					<div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
						<span>{control.frequency}</span>
						<span className="size-0.5 rounded-full bg-slate-300" />
						<span>{control.owner}</span>
					</div>
				</div>
				{control.effectiveness && (
					<EffectivenessBadge effectiveness={control.effectiveness} />
				)}
			</div>
		</div>
	);
}

function RiskRow({ risk, isExpanded, onToggle }) {
	const hasControls = risk.controls && risk.controls.length > 0;
	const controlCount = risk.controls?.length || 0;

	return (
		<div className="group">
			{/* Risk header */}
			<button
				onClick={onToggle}
				className="w-full text-left flex items-start gap-2 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
			>
				<div className="flex-shrink-0 mt-0.5">
					{isExpanded ? (
						<ChevronDown className="size-3.5 text-slate-400" />
					) : (
						<ChevronRight className="size-3.5 text-slate-400" />
					)}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1.5 mb-1">
						<span className="text-[10px] font-bold text-slate-400 tracking-wide">
							{risk.id}
						</span>
						<RatingBadge rating={risk.rating} />
						{risk.preSelected && (
							<span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-violet-50 text-violet-600">
								<Link2 className="size-2" />
								Mapped
							</span>
						)}
					</div>
					<p className="text-[11px] text-slate-700 leading-relaxed pr-1">
						{risk.description}
					</p>
					<div className="flex items-center gap-2 mt-1.5">
						<span className="text-[10px] text-slate-400">
							{risk.processArea}
						</span>
						<span className="size-0.5 rounded-full bg-slate-300" />
						<AssertionPills assertions={risk.assertions} />
						{hasControls && (
							<>
								<span className="size-0.5 rounded-full bg-slate-300" />
								<span className="text-[10px] text-slate-400">
									{controlCount} control
									{controlCount !== 1 ? 's' : ''}
								</span>
							</>
						)}
					</div>
				</div>
			</button>

			{/* Controls (expanded) */}
			{isExpanded && (
				<div className="pb-1 pt-0.5 space-y-1">
					{hasControls ? (
						risk.controls.map((ctrl) => (
							<ControlCard key={ctrl.id} control={ctrl} />
						))
					) : (
						<div className="ml-4 pl-3 border-l-2 border-dashed border-slate-200 py-2">
							<p className="text-[11px] text-slate-400 italic">
								No controls mapped — gap identified
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function CoverageMeter({ risks }) {
	const total = risks.length;
	const withControls = risks.filter(
		(r) => r.controls && r.controls.length > 0,
	).length;
	const gaps = total - withControls;
	const pct = total > 0 ? Math.round((withControls / total) * 100) : 0;

	return (
		<div className="flex items-center gap-3">
			<div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
				<div
					className={`h-full rounded-full transition-all duration-500 ${
						pct === 100
							? 'bg-emerald-500'
							: pct >= 60
								? 'bg-amber-500'
								: 'bg-red-500'
					}`}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap tabular-nums">
				{withControls}/{total}
			</span>
			{gaps > 0 && (
				<span className="text-[10px] font-medium text-amber-600 whitespace-nowrap">
					{gaps} gap{gaps !== 1 ? 's' : ''}
				</span>
			)}
		</div>
	);
}

// ── Picker modal for adding existing risks/controls ────────────

function AddRiskPicker({ availableRisks, onAdd, onClose }) {
	const [search, setSearch] = useState('');
	const filtered = availableRisks.filter(
		(r) =>
			r.description.toLowerCase().includes(search.toLowerCase()) ||
			r.category.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="border border-slate-200 rounded-lg bg-white shadow-lg overflow-hidden mt-1">
			<div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
				<Search className="size-3 text-slate-400" />
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search risks..."
					className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-300"
					autoFocus
				/>
				<button
					onClick={onClose}
					className="p-0.5 rounded hover:bg-slate-100"
				>
					<X className="size-3 text-slate-400" />
				</button>
			</div>
			<div className="max-h-36 overflow-y-auto">
				{filtered.length === 0 ? (
					<p className="text-[11px] text-slate-400 text-center py-3">
						No matching risks
					</p>
				) : (
					filtered.map((risk) => (
						<button
							key={risk.id}
							onClick={() => onAdd(risk)}
							className="w-full text-left px-3 py-2 hover:bg-violet-50 flex items-start gap-2 border-b border-slate-50 last:border-0 transition-colors"
						>
							<Plus className="size-3 text-violet-500 mt-0.5 flex-shrink-0" />
							<div className="min-w-0">
								<div className="flex items-center gap-1.5 mb-0.5">
									<span className="text-[10px] font-bold text-slate-400">
										{risk.id}
									</span>
									<RatingBadge rating={risk.rating} />
								</div>
								<p className="text-[11px] text-slate-600 leading-relaxed">
									{risk.description}
								</p>
							</div>
						</button>
					))
				)}
			</div>
		</div>
	);
}

function AddControlPicker({ availableControls, onAdd, onClose }) {
	const [search, setSearch] = useState('');
	const filtered = availableControls.filter(
		(c) =>
			c.activity.toLowerCase().includes(search.toLowerCase()) ||
			c.type.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="border border-slate-200 rounded-lg bg-white shadow-lg overflow-hidden mt-1">
			<div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
				<Search className="size-3 text-slate-400" />
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search controls..."
					className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-300"
					autoFocus
				/>
				<button
					onClick={onClose}
					className="p-0.5 rounded hover:bg-slate-100"
				>
					<X className="size-3 text-slate-400" />
				</button>
			</div>
			<div className="max-h-36 overflow-y-auto">
				{filtered.length === 0 ? (
					<p className="text-[11px] text-slate-400 text-center py-3">
						No matching controls
					</p>
				) : (
					filtered.map((ctrl) => (
						<button
							key={ctrl.id}
							onClick={() => onAdd(ctrl)}
							className="w-full text-left px-3 py-2 hover:bg-violet-50 flex items-start gap-2 border-b border-slate-50 last:border-0 transition-colors"
						>
							<Plus className="size-3 text-violet-500 mt-0.5 flex-shrink-0" />
							<div className="min-w-0">
								<div className="flex items-center gap-1.5 mb-0.5">
									<span className="text-[10px] font-bold text-slate-400">
										{ctrl.id}
									</span>
									<span
										className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${CONTROL_TYPE_STYLE[ctrl.type] || 'bg-slate-50 text-slate-600'}`}
									>
										{ctrl.type}
									</span>
								</div>
								<p className="text-[11px] text-slate-600 leading-relaxed">
									{ctrl.activity}
								</p>
								<span className="text-[10px] text-slate-400">
									{ctrl.frequency} · {ctrl.owner}
								</span>
							</div>
						</button>
					))
				)}
			</div>
		</div>
	);
}

// ── Main RACM Section ──────────────────────────────────────────

export default function RACMSection({ racm, onRacmChange }) {
	const [expandedRisks, setExpandedRisks] = useState({});
	const [showRiskPicker, setShowRiskPicker] = useState(false);
	const [addControlForRisk, setAddControlForRisk] = useState(null); // risk.id or null

	if (!racm) return null;

	const { risks, availableRisks = [], availableControls = [] } = racm;
	const preSelectedRisks = risks.filter((r) => r.preSelected);
	const unmappedRisks = risks.filter((r) => !r.preSelected);
	const totalControls = risks.reduce((s, r) => s + (r.controls?.length || 0), 0);

	const toggleRisk = (id) => {
		setExpandedRisks((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const handleAddRisk = (risk) => {
		const newRisk = {
			...risk,
			likelihood: 'Medium',
			impact:
				risk.rating === 'High' || risk.rating === 'Critical'
					? 'High'
					: 'Medium',
			processArea: 'General',
			assertions: ['Occurrence'],
			preSelected: true,
			controls: [],
		};
		onRacmChange?.({
			...racm,
			risks: [...risks, newRisk],
			availableRisks: availableRisks.filter((r) => r.id !== risk.id),
		});
		setShowRiskPicker(false);
		setExpandedRisks((prev) => ({ ...prev, [risk.id]: true }));
	};

	const handleAddControl = (control, riskId) => {
		const newControl = { ...control, effectiveness: null, preSelected: true };
		const updatedRisks = risks.map((r) =>
			r.id === riskId
				? { ...r, controls: [...(r.controls || []), newControl] }
				: r,
		);
		onRacmChange?.({
			...racm,
			risks: updatedRisks,
			availableControls: availableControls.filter((c) => c.id !== control.id),
		});
		setAddControlForRisk(null);
	};

	return (
		<div className="bg-white border border-slate-200/70 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(148,163,184,0.18)]">
			{/* Header */}
			<div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
				<div
					className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
					style={{
						background: 'rgba(106,18,205,0.08)',
						border: '1px solid rgba(106,18,205,0.16)',
					}}
				>
					<ShieldCheck className="size-3.5" style={{ color: '#6A12CD' }} />
				</div>
				<div className="flex-1 min-w-0">
					<span className="text-sm font-semibold text-slate-800">
						Risk & Control Matrix
					</span>
					<p className="text-[11px] text-slate-400 mt-0.5">
						{risks.length} risk{risks.length !== 1 ? 's' : ''} ·{' '}
						{totalControls} control{totalControls !== 1 ? 's' : ''}
					</p>
				</div>
			</div>

			{/* Coverage meter */}
			<div className="px-4 pt-3 pb-2">
				<div className="flex items-center justify-between mb-1.5">
					<span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
						Control Coverage
					</span>
				</div>
				<CoverageMeter risks={risks} />
			</div>

			{/* Pre-selected risks */}
			{preSelectedRisks.length > 0 && (
				<div className="px-2 pb-1">
					<p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 pt-2 pb-1.5">
						Mapped Risks
					</p>
					<div className="divide-y divide-slate-100">
						{preSelectedRisks.map((risk) => (
							<Fragment key={risk.id}>
								<RiskRow
									risk={risk}
									isExpanded={expandedRisks[risk.id]}
									onToggle={() => toggleRisk(risk.id)}
								/>
								{expandedRisks[risk.id] &&
									availableControls.length > 0 && (
										<div className="ml-4 pl-3 pb-2">
											{addControlForRisk === risk.id ? (
												<AddControlPicker
													availableControls={
														availableControls
													}
													onAdd={(ctrl) =>
														handleAddControl(
															ctrl,
															risk.id,
														)
													}
													onClose={() =>
														setAddControlForRisk(null)
													}
												/>
											) : (
												<button
													onClick={() =>
														setAddControlForRisk(risk.id)
													}
													className="flex items-center gap-1 text-[10px] font-medium text-violet-600 hover:text-violet-700 mt-1 px-1.5 py-1 rounded hover:bg-violet-50 transition-colors"
												>
													<Plus className="size-2.5" />
													Link control
												</button>
											)}
										</div>
									)}
							</Fragment>
						))}
					</div>
				</div>
			)}

			{/* Unmapped risks (gaps) */}
			{unmappedRisks.length > 0 && (
				<div className="px-2 pb-1">
					<div className="flex items-center gap-1.5 px-2 pt-2 pb-1.5">
						<ShieldAlert className="size-3 text-amber-500" />
						<p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest">
							Unmapped Risks
						</p>
					</div>
					<div className="divide-y divide-slate-100">
						{unmappedRisks.map((risk) => (
							<Fragment key={risk.id}>
								<RiskRow
									risk={risk}
									isExpanded={expandedRisks[risk.id]}
									onToggle={() => toggleRisk(risk.id)}
								/>
								{expandedRisks[risk.id] &&
									availableControls.length > 0 && (
										<div className="ml-4 pl-3 pb-2">
											{addControlForRisk === risk.id ? (
												<AddControlPicker
													availableControls={
														availableControls
													}
													onAdd={(ctrl) =>
														handleAddControl(
															ctrl,
															risk.id,
														)
													}
													onClose={() =>
														setAddControlForRisk(null)
													}
												/>
											) : (
												<button
													onClick={() =>
														setAddControlForRisk(risk.id)
													}
													className="flex items-center gap-1 text-[10px] font-medium text-violet-600 hover:text-violet-700 mt-1 px-1.5 py-1 rounded hover:bg-violet-50 transition-colors"
												>
													<Plus className="size-2.5" />
													Link control
												</button>
											)}
										</div>
									)}
							</Fragment>
						))}
					</div>
				</div>
			)}

			{/* Add risk from library */}
			<div className="px-3 pb-3 pt-1">
				{showRiskPicker ? (
					<AddRiskPicker
						availableRisks={availableRisks}
						onAdd={handleAddRisk}
						onClose={() => setShowRiskPicker(false)}
					/>
				) : (
					availableRisks.length > 0 && (
						<button
							onClick={() => setShowRiskPicker(true)}
							className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-200 text-[11px] font-medium text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50/40 transition-colors"
						>
							<Plus className="size-3" />
							Add risk from library
						</button>
					)
				)}
			</div>
		</div>
	);
}
