import React, { useState, useRef, useEffect } from 'react';
import {
	ChevronDown,
	FileText,
	X,
	Eye,
	ArrowLeftRight,
	Upload,
	Info,
	Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ColumnAlignment from './ColumnAlignment';

/**
 * SchemaRow
 *
 * Props:
 *  - schema          : { id, name, description, columns, mappedFiles, columnMappings }
 *    where mappedFiles  = [{ id, name, file_url }]
 *          columnMappings = [{ target, targetType, source, sourceType, confidence }]
 *  - isExpanded      : boolean
 *  - onToggle        : () => void
 *  - onRemoveFile    : (schemaId, fileId) => void
 *  - onAddFile       : (schemaId) => void
 *  - onSelectFile    : (schemaId, file) => void
 *  - onPreview       : (files, schemaName) => void  — triggers existing preview popup
 *  - onPreviewUnion  : (files, schemaName) => void  — triggers existing union preview
 *  - uploadedFiles   : array of files uploaded in step 2
 */
const SchemaRow = ({
	schema,
	isExpanded,
	onToggle,
	onRemoveFile,
	onAddFile,
	onSelectFile,
	onPreview,
	onPreviewUnion,
	uploadedFiles = [],
	chatContext,
	onChatContext,
}) => {
	const [chooseOpen, setChooseOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const chooseRef = useRef(null);
	const searchInputRef = useRef(null);

	// Close dropdown on outside click & reset search
	useEffect(() => {
		if (!chooseOpen) {
			setSearchQuery('');
			return;
		}
		// Focus search input when opened
		setTimeout(() => searchInputRef.current?.focus(), 0);
		const handler = (e) => {
			if (chooseRef.current && !chooseRef.current.contains(e.target)) {
				setChooseOpen(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [chooseOpen]);

	const fileCount = schema.mappedFiles?.length ?? 0;
	const mappedFileNames = new Set(schema.mappedFiles?.map((f) => f.name) ?? []);
	const columns = schema.columnMappings ?? [];
	const totalFields = columns.length;
	const mappedFields = columns.filter((c) => c.source && c.confidence > 0).length;
	const matchPct =
		fileCount > 0 && totalFields > 0
			? Math.round(
					columns.reduce((s, c) => s + (c.confidence || 0), 0) /
						totalFields,
				)
			: 0;

	return (
		<div
			className={cn(
				'overflow-visible rounded-2xl shadow-[0_2px_12px_0_rgba(0,0,0,0.07)] border transition-all',
				isExpanded ? 'border-[#6A12CD]' : 'border-slate-200/80',
			)}
		>
			{/* ── Header section ────────────────────────────────── */}
			<div
				onClick={() => {
					onToggle();
					// Set chat context when expanding (toggle is about to flip, so !isExpanded means it will be expanded)
					if (!isExpanded) {
						onChatContext?.({
							key: 'panel:schema',
							stepName: schema.name,
							subtitle: `${mappedFields}/${totalFields} columns mapped · ${matchPct}% match`,
						});
					} else {
						// Collapsing — clear context only if it was this schema
						if (
							chatContext?.key === 'panel:schema' &&
							chatContext?.stepName === schema.name
						) {
							onChatContext?.(null);
						}
					}
				}}
				className="flex items-start justify-between px-6 pt-5 pb-4 cursor-pointer select-none bg-white rounded-t-2xl"
			>
				{/* Left: label + name + description */}
				<div className="min-w-0">
					<p className="text-base font-bold text-slate-900 leading-tight">
						{schema.name}
					</p>
					{schema.description && (
						<p className="text-sm text-slate-400 mt-0.5">
							{schema.description}
						</p>
					)}
				</div>

				{/* Right: mapped count + chevron */}
				<div className="flex items-center gap-3 flex-shrink-0 ml-4">
					<div className="flex items-center gap-1.5">
						<p className="text-[20px] font-bold text-slate-800 tabular-nums leading-tight">
							{mappedFields}/{totalFields}
						</p>
						<p className="text-[11px] text-slate-400 font-medium leading-tight">
							column
							<br />
							mapped
						</p>
					</div>
					<ChevronDown
						className={cn(
							'size-5 text-slate-400 transition-transform duration-200',
							isExpanded && 'rotate-180',
						)}
					/>
				</div>
			</div>

			{/* ── Mapped sources (always visible) ──────────────── */}
			<div
				onClick={(e) => {
					e.stopPropagation();
					onChatContext?.({
						key: 'panel:mapped_sources',
						stepName: `${schema.name} — Sources`,
						subtitle: `${fileCount} file${fileCount !== 1 ? 's' : ''} mapped`,
					});
				}}
				className={cn(
					'px-6 pb-5 bg-white cursor-pointer',
					!isExpanded && 'rounded-b-2xl',
				)}
			>
				{/* Divider */}
				<div className="border-t border-slate-100 mb-4" />

				{/* Row: MAPPED SOURCES + Preview Data ... Match % */}
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-3">
						<p className="text-[11px] font-bold text-slate-400 tracking-wider">
							Mapped Sources
						</p>
						{fileCount > 0 && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									fileCount >= 2
										? onPreviewUnion?.(
												schema.mappedFiles,
												schema.name,
											)
										: onPreview?.(
												schema.mappedFiles,
												schema.name,
											);
								}}
								className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors bg-white"
							>
								<Eye className="size-3.5" /> Preview
							</button>
						)}
					</div>

					{fileCount > 0 && (
						<div className="flex items-center gap-1.5">
							<span
								className={cn(
									'text-xs font-bold uppercase tracking-wider tabular-nums',
									matchPct >= 90
										? 'text-emerald-600'
										: 'text-amber-600',
								)}
							>
								{matchPct}% Match
							</span>
							<Info
								className={cn(
									'size-3.5',
									matchPct >= 90
										? 'text-emerald-500'
										: 'text-amber-500',
								)}
							/>
						</div>
					)}
				</div>

				{/* File pills + action buttons */}
				{fileCount === 0 && (
					<p className="text-sm text-slate-400 italic py-2">
						No files mapped. Upload or choose a file to get started.
					</p>
				)}

				<div className="flex items-center justify-between gap-4">
					{/* Left: file pills (show max 2 + overflow) */}
					<div className="flex items-center gap-2 min-w-0">
						{fileCount > 0 &&
							schema.mappedFiles.slice(0, 2).map((f) => (
								<span
									key={f.id}
									className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg bg-[#6A12CD]/[0.06] border border-[#6A12CD]/10 text-sm text-slate-700"
								>
									<FileText className="size-3.5 text-[#6A12CD]/50 flex-shrink-0" />
									<span className="truncate max-w-[160px]">
										{f.name}
									</span>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onRemoveFile?.(schema.id, f.id);
										}}
										className="p-0.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors ml-0.5"
										title="Remove file"
									>
										<X className="size-3" />
									</button>
								</span>
							))}
						{fileCount > 2 && (
							<span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-[#6A12CD]/20 bg-[#6A12CD]/[0.04] text-sm font-medium text-[#6A12CD] whitespace-nowrap">
								+ {fileCount - 2} more
							</span>
						)}
					</div>

					{/* Right: Choose File + Upload New */}
					<div className="flex items-center gap-2 flex-shrink-0">
						{/* Choose File dropdown */}
						<div className="relative" ref={chooseRef}>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setChooseOpen((prev) => !prev);
								}}
								className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#6A12CD]/30 text-sm font-medium text-[#6A12CD] hover:border-[#6A12CD]/50 hover:bg-[#6A12CD]/[0.03] transition-colors"
							>
								<ArrowLeftRight className="size-3.5" /> Select
								File(s)
							</button>

							{chooseOpen && uploadedFiles.length > 0 && (
								<div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
									{/* Search input */}
									<div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
										<Search className="size-4 text-slate-400 flex-shrink-0" />
										<input
											ref={searchInputRef}
											type="text"
											value={searchQuery}
											onChange={(e) =>
												setSearchQuery(e.target.value)
											}
											onClick={(e) => e.stopPropagation()}
											placeholder="Search..."
											className="w-full text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
										/>
									</div>

									{/* File list with checkboxes */}
									<div className="max-h-60 overflow-y-auto py-1">
										{uploadedFiles
											.filter((f) =>
												f.name
													.toLowerCase()
													.includes(
														searchQuery.toLowerCase(),
													),
											)
											.map((f, idx) => {
												const isChecked =
													mappedFileNames.has(f.name);
												return (
													<label
														key={f.id ?? idx}
														onClick={(e) =>
															e.stopPropagation()
														}
														className={cn(
															'flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer transition-colors',
															isChecked
																? 'text-slate-800'
																: 'text-slate-600 hover:bg-slate-50',
														)}
													>
														<input
															type="checkbox"
															checked={isChecked}
															onChange={(e) => {
																e.stopPropagation();
																if (isChecked) {
																	const mapped =
																		schema.mappedFiles?.find(
																			(mf) =>
																				mf.name ===
																				f.name,
																		);
																	if (mapped)
																		onRemoveFile?.(
																			schema.id,
																			mapped.id,
																		);
																} else {
																	onSelectFile?.(
																		schema.id,
																		f,
																	);
																}
															}}
															className="size-4 rounded border-slate-300 text-[#6A12CD] accent-[#6A12CD] flex-shrink-0 cursor-pointer"
														/>
														<span className="truncate">
															{f.name}
														</span>
													</label>
												);
											})}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* ── Expanded detail panel (column alignment) ─────── */}
			{isExpanded && columns.length > 0 && (
				<div
					onClick={(e) => {
						e.stopPropagation();
						onChatContext?.({
							key: 'panel:columns',
							stepName: `${schema.name} — Columns`,
							subtitle: `${mappedFields}/${totalFields} mapped · ${columns.filter((c) => c.confidence > 0 && c.confidence < 85).length} need attention`,
						});
					}}
					className="border-t border-slate-300 rounded-b-2xl bg-white px-6 py-5 space-y-5 cursor-pointer"
				>
					<ColumnAlignment columns={columns} />
				</div>
			)}
		</div>
	);
};

export default SchemaRow;
