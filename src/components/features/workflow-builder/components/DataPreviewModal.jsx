import { useState, useEffect } from 'react';
import { Loader, AlertTriangle, X } from 'lucide-react';
import { Files, FileText } from '@phosphor-icons/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ---------------------  CSV parser  -----------------------------------
const parseCSV = (text) => {
	const result = [];
	let row = [];
	let field = '';
	let inQuotes = false;
	const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

	for (let i = 0; i < normalized.length; i++) {
		const ch = normalized[i];
		const next = normalized[i + 1];
		if (inQuotes) {
			if (ch === '"' && next === '"') {
				field += '"';
				i++;
			} else if (ch === '"') {
				inQuotes = false;
			} else {
				field += ch;
			}
		} else {
			if (ch === '"') {
				inQuotes = true;
			} else if (ch === ',') {
				row.push(field.trim());
				field = '';
			} else if (ch === '\n') {
				row.push(field.trim());
				result.push(row);
				row = [];
				field = '';
			} else {
				field += ch;
			}
		}
	}
	row.push(field.trim());
	if (row.some((f) => f !== '')) result.push(row);
	if (result.length === 0) return { headers: [], rows: [], totalRows: 0 };

	const headers = result[0].map((h) => h.replace(/^"|"$/g, '').trim());
	const rows = result.slice(1).map((rowArr) =>
		headers.reduce(
			(acc, h, i) => ({
				...acc,
				[h]: (rowArr[i] ?? '').replace(/^"|"$/g, ''),
			}),
			{},
		),
	);
	return { headers, rows, totalRows: result.length - 1 };
};

const PREVIEW_ROW_LIMIT = 5;

// ---------------------  DataPreviewModal  ----------------------------
// Props:
//   open         – boolean
//   onClose      – () => void
//   files        – array of { file: File|null, name: string, url?: string }
//   schemaName   – string, shown in the header
export function DataPreviewModal({ open, onClose, files = [], schemaName }) {
	const isMultiple = files.length > 1;
	const [activeIdx, setActiveIdx] = useState(0);
	const [csvData, setCsvData] = useState({ headers: [], rows: [], totalRows: 0 });
	const [isLoading, setIsLoading] = useState(false);
	const [fetchError, setFetchError] = useState(null);

	const activeEntry = files[activeIdx] ?? files[0];

	// Reset when modal opens
	useEffect(() => {
		if (open) setActiveIdx(0);
	}, [open]);

	// Load CSV whenever the active entry changes
	useEffect(() => {
		if (!activeEntry || !open) return;
		setIsLoading(true);
		setFetchError(null);
		setCsvData({ headers: [], rows: [], totalRows: 0 });

		const load = async () => {
			try {
				let text = '';
				if (activeEntry.file instanceof File) {
					text = await activeEntry.file.text();
				} else if (activeEntry.url) {
					const r = await fetch(activeEntry.url);
					if (!r.ok) throw new Error(`HTTP ${r.status}`);
					text = await r.text();
				} else {
					setIsLoading(false);
					return;
				}
				setCsvData(parseCSV(text));
			} catch {
				setFetchError('Unable to load file preview.');
			} finally {
				setIsLoading(false);
			}
		};

		load();
	}, [activeEntry, open]);

	const previewRows = csvData.rows.slice(0, PREVIEW_ROW_LIMIT);
	const previewCount = Math.min(PREVIEW_ROW_LIMIT, csvData.totalRows);
	const hasNoSource = !activeEntry?.file && !activeEntry?.url;

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent
				hideClose
				className="max-w-4xl w-full p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
			>
				{/* X close button — top right corner */}
				<button
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 z-10 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
				>
					<X size={16} />
				</button>

				{/* Header */}
				<div className="px-6 pt-6 pb-5 flex items-center gap-4 pr-14">
					<div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
						<FileText size={22} weight="fill" className="text-white" />
					</div>
					<div>
						<h2 className="text-lg font-bold text-slate-900 leading-tight">
							{isMultiple && activeEntry
								? activeEntry.name
								: schemaName}
						</h2>
						<p className="text-sm text-slate-400 mt-0.5">
							{isLoading
								? 'Loading preview…'
								: hasNoSource
									? 'No file available to preview'
									: csvData.totalRows > 0
										? `Previewing first ${previewCount} ${previewCount === 1 ? 'entry' : 'entries'}`
										: 'No data available'}
						</p>
					</div>
				</div>

				{/* File tabs for multiple files */}
				{isMultiple && (
					<div className="flex gap-1 px-6 pb-3">
						{files.map((entry, idx) => (
							<button
								key={entry.name}
								type="button"
								onClick={() => setActiveIdx(idx)}
								className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
									idx === activeIdx
										? 'bg-violet-100 text-violet-700'
										: 'text-slate-500 hover:bg-slate-100'
								}`}
							>
								{entry.name}
							</button>
						))}
					</div>
				)}

				{/* Divider */}
				<div className="border-t border-slate-100" />

				{/* Table area */}
				<div className="px-6 py-5 min-h-[200px]">
					{isLoading && (
						<div className="flex items-center justify-center h-40">
							<Loader className="text-violet-600 animate-spin size-7" />
						</div>
					)}

					{fetchError && !isLoading && (
						<div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-3">
							<AlertTriangle size={28} className="text-amber-400" />
							<p className="text-sm">{fetchError}</p>
						</div>
					)}

					{!isLoading && !fetchError && hasNoSource && (
						<div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
							<Files size={28} />
							<p className="text-sm">No file available to preview</p>
						</div>
					)}

					{!isLoading &&
						!fetchError &&
						!hasNoSource &&
						csvData.headers.length === 0 && (
							<div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
								<Files size={28} />
								<p className="text-sm">No data to preview</p>
							</div>
						)}

					{!isLoading && !fetchError && csvData.headers.length > 0 && (
						<div className="overflow-x-auto rounded-lg border border-slate-100">
							<table
								className="text-sm"
								style={{ minWidth: 'max-content', width: '100%' }}
							>
								<thead>
									<tr>
										<th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-white border-b border-slate-100 w-16 sticky left-0 z-10">
											ROW
										</th>
										{csvData.headers.map((h) => (
											<th
												key={h}
												className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-white border-b border-slate-100 whitespace-nowrap"
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{previewRows.map((row, rowIdx) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: preview rows have no stable IDs
										<tr
											key={rowIdx}
											className={
												rowIdx < previewRows.length - 1
													? 'border-b border-slate-100'
													: ''
											}
										>
											<td className="px-4 py-3.5 text-sm text-slate-400 font-medium sticky left-0 bg-white z-10">
												{rowIdx + 1}
											</td>
											{csvData.headers.map((col) => (
												<td
													key={col}
													className="px-4 py-3.5 text-sm text-slate-700 whitespace-nowrap"
												>
													{row[col] || (
														<span className="text-slate-300 italic">
															—
														</span>
													)}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="bg-slate-50 px-6 py-4 flex justify-end rounded-b-2xl border-t border-slate-100">
					<button
						type="button"
						onClick={onClose}
						className="px-6 py-2.5 bg-[#1e1238] text-white text-sm font-semibold rounded-xl hover:bg-[#2a1850] transition-colors"
					>
						Close Preview
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
