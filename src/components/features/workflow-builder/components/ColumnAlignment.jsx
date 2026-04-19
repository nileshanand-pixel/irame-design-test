import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	AlertTriangle,
	Info,
	Plus,
	Sparkles,
	X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Demo uploaded columns for dropdown ─────────────────────────── */
const DEMO_UPLOADED_COLUMNS = [
	'VendorId',
	'VendorName',
	'vendor_name',
	'vendor_code',
	'inv_number',
	'inv_date',
	'amount',
	'total_amount',
	'po_ref',
	'po_number',
	'status',
	'country',
	'region',
	'department',
	'description',
	'gl_code',
	'account_name',
	'debit',
	'credit',
	'period',
];

/**
 * ColumnAlignment
 *
 * Props:
 *  - columns        : [{ target, targetType, source, sourceType, confidence }]
 *                      source = expected/master column (LEFT)
 *                      target = uploaded file column mapping (RIGHT)
 *  - autoThreshold  : number (default 85)
 *  - uploadedColumns: string[]
 */
const ColumnAlignment = ({ columns = [], autoThreshold = 85, uploadedColumns }) => {
	const [autoExpanded, setAutoExpanded] = useState(false);

	/* ── Partition ─────────────────────────────────────────────── */
	const autoMapped = [];
	const exceptions = [];

	columns.forEach((col) => {
		const isUnmapped = !col.source;
		const isLowConf = col.confidence > 0 && col.confidence < autoThreshold;
		const isTypeMismatch =
			col.source &&
			col.sourceType &&
			col.targetType &&
			col.sourceType !== col.targetType &&
			col.confidence >= autoThreshold;

		if (isUnmapped || isLowConf || isTypeMismatch) {
			exceptions.push({
				...col,
				reason: isUnmapped
					? 'unmapped'
					: isTypeMismatch
						? 'type_mismatch'
						: 'low_confidence',
			});
		} else {
			autoMapped.push(col);
		}
	});

	const avgConf =
		autoMapped.length > 0
			? Math.round(
					autoMapped.reduce((s, c) => s + c.confidence, 0) /
						autoMapped.length,
				)
			: 0;

	/* ── AI justification — deterministic, seeded by confidence ─ */
	const getJustification = (col) => {
		if (!col.source || col.confidence === 0) return null;
		const base = col.confidence;
		const typeMatch = col.sourceType === col.targetType;
		const seed = (col.source.length * 7 + base) % 10;
		return [
			{
				label: 'Name Similarity',
				weight: 35,
				score: Math.max(30, Math.min(100, base - 10 + seed)),
				description: 'Fuzzy string matching & token comparison',
				barColor: 'bg-red-500',
				scoreColor: (s) =>
					s >= 80
						? 'text-green-600'
						: s >= 60
							? 'text-red-500'
							: 'text-red-600',
			},
			{
				label: 'Type Compatibility',
				weight: 25,
				score: typeMatch
					? Math.min(100, base + 14)
					: Math.max(40, base - 26),
				description: 'Data type inference & format alignment',
				barColor: 'bg-[#6A12CD]',
				scoreColor: (s) =>
					s >= 80
						? 'text-green-600'
						: s >= 60
							? 'text-amber-600'
							: 'text-red-500',
			},
			{
				label: 'Statistical Profile',
				weight: 20,
				score: Math.max(40, Math.min(100, base + 1)),
				description: 'Value distribution, cardinality & null ratio',
				barColor: 'bg-amber-500',
				scoreColor: (s) =>
					s >= 80
						? 'text-amber-600'
						: s >= 60
							? 'text-amber-600'
							: 'text-red-500',
			},
			{
				label: 'Semantic Similarity',
				weight: 20,
				score: Math.max(35, Math.min(100, base - 7 + (seed % 4))),
				description: 'Embedding-based meaning comparison',
				barColor: 'bg-amber-500',
				scoreColor: (s) =>
					s >= 80
						? 'text-amber-600'
						: s >= 60
							? 'text-amber-600'
							: 'text-red-500',
			},
		];
	};

	const getSummary = (col) => {
		if (!col.source) return null;
		const typeMatch = col.sourceType === col.targetType;
		if (col.confidence >= 90 && typeMatch)
			return 'Strong match — high confidence across all signals. Auto-mapping recommended.';
		if (col.confidence >= 90 && !typeMatch)
			return 'Strong name match, but type mismatch needs review before proceeding.';
		if (col.confidence >= 70)
			return 'Partial match — field names share some overlap but data patterns show divergence. Review recommended.';
		return 'Low confidence — manual mapping recommended.';
	};

	/* ── Column selector dropdown ─────────────────────────────── */
	const ColumnSelector = ({ col, currentTarget }) => {
		const [open, setOpen] = useState(false);
		const [search, setSearch] = useState('');
		const ref = useRef(null);
		const available = uploadedColumns || DEMO_UPLOADED_COLUMNS;

		useEffect(() => {
			const handler = (e) => {
				if (ref.current && !ref.current.contains(e.target)) setOpen(false);
			};
			if (open) document.addEventListener('mousedown', handler);
			return () => document.removeEventListener('mousedown', handler);
		}, [open]);

		const filtered = available.filter((c) =>
			c.toLowerCase().includes(search.toLowerCase()),
		);

		return (
			<div ref={ref} className="relative">
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						setOpen((v) => !v);
					}}
					className={cn(
						'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
						currentTarget
							? 'border border-slate-200 hover:border-[#6A12CD]/40 hover:shadow-sm hover:shadow-violet-100'
							: 'border border-dashed border-violet-300 hover:border-[#6A12CD] hover:bg-violet-50/60',
					)}
				>
					{currentTarget ? (
						<>
							<span className="font-semibold text-[#6A12CD] text-[13px] tracking-tight truncate">
								{currentTarget}
							</span>
							{col.targetType && (
								<span className="text-[10px] font-medium text-slate-400/80 uppercase tracking-wide flex-shrink-0">
									{col.targetType}
								</span>
							)}
						</>
					) : (
						<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6A12CD]">
							<Plus className="size-3" />
							Map column
						</span>
					)}
					<ChevronDown
						className={cn(
							'size-3 text-slate-400/70 flex-shrink-0 transition-transform ml-1',
							open && 'rotate-180',
						)}
					/>
				</button>

				{open && (
					<div className="absolute top-full left-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg shadow-slate-200/60 border border-slate-200 z-50 overflow-hidden">
						<div className="p-2 border-b border-slate-100">
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search columns..."
								className="w-full text-[13px] px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-[#6A12CD]/50 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-300"
								autoFocus
								onClick={(e) => e.stopPropagation()}
							/>
						</div>
						<div className="max-h-48 overflow-y-auto py-1">
							{filtered.length > 0 ? (
								filtered.map((colName) => (
									<button
										key={colName}
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setOpen(false);
										}}
										className={cn(
											'w-full text-left px-3 py-2 text-[13px] hover:bg-violet-50 transition-colors flex items-center justify-between',
											colName === currentTarget
												? 'bg-violet-50/80 text-[#6A12CD] font-semibold'
												: 'text-slate-600',
										)}
									>
										<span>{colName}</span>
										{colName === currentTarget && (
											<CheckCircle2 className="size-3.5 text-[#6A12CD]" />
										)}
									</button>
								))
							) : (
								<p className="px-3 py-3 text-xs text-slate-400 text-center">
									No matching columns
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		);
	};

	/* ── AI Justification Popup (portal) ──────────────────────── */
	const AIJustificationPopup = ({ col }) => {
		const [open, setOpen] = useState(false);
		const triggerRef = useRef(null);
		const panelRef = useRef(null);
		const justification = useMemo(
			() => getJustification(col),
			[col.source, col.confidence, col.sourceType, col.targetType],
		);
		const summary = getSummary(col);
		const [pos, setPos] = useState({ top: 0, left: 0 });

		useEffect(() => {
			if (open && triggerRef.current) {
				const rect = triggerRef.current.getBoundingClientRect();
				const panelW = 280;
				let left = rect.right - panelW;
				if (left < 12) left = 12;
				if (left + panelW > window.innerWidth - 12)
					left = window.innerWidth - panelW - 12;
				const maxTop = document.documentElement.scrollHeight - 420;
				if (pos.top > maxTop)
					setPos((p) => ({ ...p, top: rect.top - 10 + window.scrollY }));
				setPos({
					top: rect.bottom + 10 + window.scrollY,
					left: left + window.scrollX,
				});
			}
		}, [open]);

		useEffect(() => {
			const handler = (e) => {
				if (
					panelRef.current &&
					!panelRef.current.contains(e.target) &&
					triggerRef.current &&
					!triggerRef.current.contains(e.target)
				) {
					setOpen(false);
				}
			};
			if (open) document.addEventListener('mousedown', handler);
			return () => document.removeEventListener('mousedown', handler);
		}, [open]);

		if (!justification) return null;

		return (
			<>
				<button
					ref={triggerRef}
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						setOpen((v) => !v);
					}}
					className={cn(
						'p-0.5 rounded-full transition-colors',
						open
							? 'text-[#6A12CD] bg-violet-100'
							: 'text-slate-300 hover:text-[#6A12CD] hover:bg-violet-50',
					)}
					title="View AI justification"
				>
					<Info className="size-3.5" />
				</button>

				{open &&
					createPortal(
						<div
							ref={panelRef}
							className="w-[280px] bg-white rounded-xl shadow-xl shadow-slate-300/30 border border-slate-200/80 z-[9999]"
							style={{
								top: pos.top,
								left: pos.left,
								position: 'absolute',
							}}
						>
							{/* ── Header ─────────────────────────── */}
							<div className="px-3.5 pt-3 pb-2 flex items-center justify-between">
								<div className="flex items-center gap-1.5">
									<div className="flex items-center justify-center size-5 rounded bg-violet-100">
										<Sparkles className="size-3 text-[#6A12CD]" />
									</div>
									<span className="text-[10px] font-bold text-[#6A12CD] uppercase tracking-[0.08em]">
										AI Justification
									</span>
								</div>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setOpen(false);
									}}
									className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
								>
									<X className="size-3.5" />
								</button>
							</div>

							{/* ── Metrics ────────────────────────── */}
							<div className="px-3.5 pb-3 space-y-3">
								{justification.map((item) => (
									<div key={item.label}>
										<div className="flex items-baseline justify-between mb-1">
											<div className="flex items-baseline gap-1.5">
												<span className="text-[12px] font-bold text-slate-800 tracking-tight leading-none">
													{item.label}
												</span>
												<span className="text-[10px] font-medium text-slate-400">
													&times;{item.weight}%
												</span>
											</div>
											<span
												className={cn(
													'text-[12px] font-bold tabular-nums leading-none',
													item.scoreColor(item.score),
												)}
											>
												{item.score}%
											</span>
										</div>
										<div className="w-full h-[5px] bg-slate-100 rounded-full overflow-hidden mb-1">
											<div
												className={cn(
													'h-full rounded-full transition-all duration-500',
													item.barColor,
												)}
												style={{ width: `${item.score}%` }}
											/>
										</div>
										<p className="text-[10px] text-slate-400 leading-snug">
											{item.description}
										</p>
									</div>
								))}
							</div>

							{/* ── Summary ────────────────────────── */}
							{summary && (
								<>
									<div className="mx-3.5 border-t border-slate-100" />
									<div className="px-3.5 py-2.5">
										<p className="text-[11px] text-slate-500 leading-relaxed">
											{summary}
										</p>
										<div className="flex items-center gap-2 mt-2">
											<span
												className={cn(
													'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border',
													col.confidence >= 85
														? 'text-green-700 bg-green-50/80 border-green-200'
														: col.confidence >= 70
															? 'text-amber-700 bg-amber-50/80 border-amber-200'
															: 'text-red-700 bg-red-50/80 border-red-200',
												)}
											>
												Overall: {col.confidence}%
											</span>
											<span className="text-[10px] text-slate-400">
												{col.source} &rarr; {col.target}
											</span>
										</div>
									</div>
								</>
							)}
						</div>,
						document.body,
					)}
			</>
		);
	};

	/* ── Row renderer ─────────────────────────────────────────── */
	const FieldRow = ({ col, variant = 'auto' }) => {
		const isUnmapped = !col.source;

		const rowBase =
			variant === 'auto'
				? 'border-l-[3px] border-l-violet-400 bg-white'
				: isUnmapped
					? 'border-l-[3px] border-l-red-400 bg-red-50/30'
					: 'border-l-[3px] border-l-amber-400 bg-amber-50/30';

		return (
			<div
				className={cn(
					'group grid grid-cols-[1fr_28px_1fr_80px] items-center gap-3 pl-4 pr-3 py-3 transition-colors hover:bg-slate-50/60',
					rowBase,
				)}
			>
				{/* Source column (LEFT) — expected/master schema */}
				<div className="flex items-center gap-2.5 min-w-0">
					<span className="font-semibold text-slate-800 text-[13px] tracking-tight truncate">
						{col.source || col.target}
					</span>
					{(col.sourceType || col.targetType) && (
						<span className="text-[10px] font-medium text-slate-400/70 uppercase tracking-wide flex-shrink-0 bg-slate-100/80 px-1.5 py-0.5 rounded">
							{col.sourceType || col.targetType}
						</span>
					)}
					{col.reason === 'type_mismatch' && (
						<span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold flex-shrink-0 bg-amber-100/80 px-1.5 py-0.5 rounded">
							&ne; {col.targetType}
						</span>
					)}
				</div>

				{/* Arrow */}
				<div className="flex justify-center">
					<span className="text-slate-300/80 text-sm">&rarr;</span>
				</div>

				{/* Target schema (RIGHT) — clickable dropdown */}
				<div className="flex items-center min-w-0">
					{isUnmapped ? (
						<ColumnSelector col={col} currentTarget={null} />
					) : (
						<ColumnSelector col={col} currentTarget={col.target} />
					)}
				</div>

				{/* Confidence */}
				<div className="flex items-center justify-end gap-1.5 tabular-nums text-[13px] font-bold">
					{col.confidence > 0 ? (
						<>
							<span
								className={
									col.confidence >= 90
										? 'text-green-600'
										: col.confidence >= autoThreshold
											? 'text-violet-600'
											: 'text-amber-600'
								}
							>
								{col.confidence}%
							</span>
							<AIJustificationPopup col={col} />
						</>
					) : (
						<span className="text-slate-300">&mdash;</span>
					)}
				</div>
			</div>
		);
	};

	return (
		<div>
			{/* Section label */}
			<p className="text-[11px] font-bold text-slate-400 tracking-wider mb-2.5">
				Column Alignment
			</p>

			{/* Sub-header */}
			<div className="grid grid-cols-[1fr_28px_1fr_80px] gap-3 px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200/80 bg-slate-50/40">
				<span>Source column</span>
				<span />
				<span>Target schema</span>
				<span className="text-right">Confidence</span>
			</div>

			{/* ── Auto-mapped summary bar ──────────────────────────── */}
			{autoMapped.length > 0 && (
				<>
					<button
						type="button"
						onClick={() => setAutoExpanded((v) => !v)}
						className="w-full flex items-center justify-between px-4 py-3 bg-violet-50/50 hover:bg-violet-50/80 transition-colors border-b border-violet-100/50"
					>
						<div className="flex items-center gap-2.5">
							<CheckCircle2 className="size-4 text-violet-500" />
							<span className="text-[13px] text-violet-700 font-semibold tracking-tight">
								{autoMapped.length} field
								{autoMapped.length !== 1 ? 's' : ''} auto-mapped
								<span className="text-violet-400/60 mx-1.5">
									&middot;
								</span>
								<span className="font-medium text-violet-500">
									avg {avgConf}% confidence
								</span>
							</span>
						</div>
						<span className="flex items-center gap-1 text-[12px] text-violet-600 font-semibold">
							{autoExpanded ? 'Collapse' : 'Expand'}
							{autoExpanded ? (
								<ChevronUp className="size-3.5" />
							) : (
								<ChevronDown className="size-3.5" />
							)}
						</span>
					</button>

					{autoExpanded && (
						<div className="divide-y divide-slate-100/80">
							{autoMapped.map((col, i) => (
								<FieldRow
									key={`auto-${i}`}
									col={col}
									variant="auto"
								/>
							))}
						</div>
					)}
				</>
			)}

			{/* ── Exception fields ─────────────────────────────────── */}
			{exceptions.length > 0 && (
				<>
					<div className="px-4 py-2.5 flex items-center gap-2 bg-amber-50/40 border-b border-slate-100">
						<AlertTriangle className="size-3.5 text-amber-500" />
						<span className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.1em]">
							Needs attention ({exceptions.length})
						</span>
					</div>

					<div className="divide-y divide-slate-100/60">
						{exceptions.map((col, i) => (
							<FieldRow
								key={`exc-${i}`}
								col={col}
								variant="exception"
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
};

export default ColumnAlignment;
