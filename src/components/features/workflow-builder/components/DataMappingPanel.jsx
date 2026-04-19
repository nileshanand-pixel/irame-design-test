import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
	Sparkles,
	AlertTriangle,
	ChevronRight,
	ArrowLeft,
	GitCompareArrows,
} from 'lucide-react';
import SchemaRow from './SchemaRow';

/* ── Deterministic demo helpers ───────────────────────────────────── */

function colConfPct(j) {
	return j === 0 ? 96 : j === 1 ? 78 : j === 2 ? 93 : 62 + ((j * 11) % 30);
}

const TYPE_MAP = {
	emp_id: 'STRING',
	emp_name: 'STRING',
	gross_pay: 'DECIMAL',
	bank_account: 'STRING',
	department: 'STRING',
	pay_date: 'TIMESTAMP',
	employee_id: 'STRING',
	full_name: 'STRING',
	grade: 'STRING',
	approved_salary: 'DECIMAL',
	joining_date: 'TIMESTAMP',
	invoice_no: 'STRING',
	vendor_name: 'STRING',
	vendor_id: 'STRING',
	amount: 'DECIMAL',
	invoice_date: 'TIMESTAMP',
	po_reference: 'STRING',
	po_number: 'STRING',
	approved_amount: 'DECIMAL',
	po_date: 'TIMESTAMP',
	status: 'STRING',
	clause_id: 'STRING',
	description: 'STRING',
	rate: 'DECIMAL',
	scope: 'STRING',
	penalty: 'DECIMAL',
	gl_code: 'STRING',
	account_name: 'STRING',
	debit: 'DECIMAL',
	credit: 'DECIMAL',
	period: 'STRING',
	requester: 'STRING',
	registration_no: 'STRING',
	country: 'STRING',
	min_salary: 'DECIMAL',
	max_salary: 'DECIMAL',
	effective_date: 'TIMESTAMP',
};

function inferType(colName) {
	if (TYPE_MAP[colName]) return TYPE_MAP[colName];
	if (/date|time/i.test(colName)) return 'TIMESTAMP';
	if (/amount|pay|salary|rate|debit|credit|price|cost/i.test(colName))
		return 'DECIMAL';
	return 'STRING';
}

function generateSourceName(targetCol) {
	return targetCol
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.replace(/ /g, '');
}

function fileMappedName(inp, uploadedFiles, idx) {
	if (uploadedFiles[idx]) return uploadedFiles[idx].name;
	return inp.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_sample.csv';
}

/**
 * DataMappingPanel
 *
 * Props:
 *  - workflow         : { inputs, name, id, ... }
 *  - uploadedFiles    : array of uploaded file entries
 *  - onConfirmMapping : () => void — wired to existing handleConfirmMapping
 *  - onPreview        : (previewObj) => void — calls setPreviewFile
 *  - onChangeFile     : (inputId) => void — triggers file picker
 */
const DataMappingPanel = ({
	workflow,
	uploadedFiles = [],
	onConfirmMapping,
	onPreview,
	onChangeFile,
	onBack,
	chatContext,
	onChatContext,
}) => {
	const [expandedId, setExpandedId] = useState(workflow?.inputs?.[0]?.id ?? null);
	const changeFileRef = useRef(null);

	/* ── Build schema list with mock mapping data ─────────────── */
	const schemas = useMemo(() => {
		if (!workflow?.inputs) return [];

		return workflow.inputs.map((inp, inputIdx) => {
			const isMultiFile = inputIdx === 0 || inp?.name?.includes('Invoice');
			const baseName = fileMappedName(inp, uploadedFiles, inputIdx);

			const mappedFiles = isMultiFile
				? [
						{
							id: `${inp.id}_f1`,
							name: 'Jan_Invoices.csv',
							file_url: null,
						},
						{
							id: `${inp.id}_f2`,
							name: 'Feb_Invoices.csv',
							file_url: null,
						},
						{
							id: `${inp.id}_f3`,
							name: 'Mar_Invoices.csv',
							file_url: null,
						},
					]
				: [
						{
							id: `${inp.id}_f1`,
							name: baseName,
							file_url: null,
						},
					];

			const columnMappings = (inp.columns ?? []).map((col, j) => {
				const conf = colConfPct(j);
				const targetType = inferType(col);
				const isUnmapped = conf < 70;
				const sourceType = isUnmapped
					? null
					: j === 1 && conf < 85
						? 'DECIMAL'
						: targetType; // introduce a type mismatch for low-conf demo

				return {
					target: col,
					targetType,
					source: isUnmapped ? null : generateSourceName(col),
					sourceType,
					confidence: isUnmapped ? 0 : conf,
				};
			});

			return {
				id: inp.id,
				name: inp.name,
				description: inp.description,
				columns: inp.columns,
				mappedFiles,
				columnMappings,
			};
		});
	}, [workflow, uploadedFiles]);

	/* ── Progress ──────────────────────────────────────────────── */
	const totalSchemas = schemas.length;
	const mappedSchemas = schemas.filter(
		(s) =>
			s.mappedFiles.length > 0 &&
			s.columnMappings.every((c) => c.source && c.confidence >= 85),
	).length;
	const progressPct =
		totalSchemas > 0 ? Math.round((mappedSchemas / totalSchemas) * 100) : 0;

	/* ── File removal (removes from local schema list — demo) ── */
	const [removedFiles, setRemovedFiles] = useState({});
	const handleRemoveFile = useCallback((schemaId, fileId) => {
		setRemovedFiles((prev) => ({
			...prev,
			[`${schemaId}:${fileId}`]: true,
		}));
	}, []);

	/* ── Filtered schemas (apply removals) ─────────────────────── */
	const displaySchemas = useMemo(
		() =>
			schemas.map((s) => ({
				...s,
				mappedFiles: s.mappedFiles.filter(
					(f) => !removedFiles[`${s.id}:${f.id}`],
				),
			})),
		[schemas, removedFiles],
	);

	/* ── Preview handlers (delegate to parent) ─────────────────── */
	const handlePreview = useCallback(
		(files, schemaName) => {
			onPreview?.({
				file: null,
				name: files[0]?.name,
				schemaName,
			});
		},
		[onPreview],
	);

	const handlePreviewUnion = useCallback(
		(files, schemaName) => {
			onPreview?.({
				file: null,
				name: files[0]?.name,
				schemaName,
			});
		},
		[onPreview],
	);

	const handleAddFile = useCallback(
		(schemaId) => {
			onChangeFile?.(schemaId);
		},
		[onChangeFile],
	);

	/* ── Recalc mapped count from display schemas ──────────────── */
	const mappedDisplay = displaySchemas.filter(
		(s) =>
			s.mappedFiles.length > 0 &&
			s.columnMappings.every((c) => c.source && c.confidence >= 85),
	).length;

	const displayProgressPct =
		totalSchemas > 0 ? Math.round((mappedDisplay / totalSchemas) * 100) : 0;

	return (
		<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
			{/* ── Header ───────────────────────────────────────── */}
			<div className="px-5 h-16 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
				<div className="flex items-center gap-3">
					{onBack && (
						<button
							onClick={onBack}
							className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
						>
							<ArrowLeft className="size-4" />
						</button>
					)}
					<div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
						<GitCompareArrows className="size-4 text-violet-600" />
					</div>
					<h3 className="text-[15px] font-semibold text-gray-900">
						Data Mapping
					</h3>
				</div>
				<button
					type="button"
					onClick={onConfirmMapping}
					className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold transition-colors"
				>
					Confirm &amp; Proceed
					<ChevronRight className="size-4" />
				</button>
			</div>

			<div className="pt-4 flex-shrink-0" />
			{/* ── Schema list ──────────────────────────────────── */}
			<div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
				<div className="space-y-4">
					{displaySchemas.map((schema) => (
						<SchemaRow
							key={schema.id}
							schema={schema}
							isExpanded={expandedId === schema.id}
							onToggle={() =>
								setExpandedId((prev) =>
									prev === schema.id ? null : schema.id,
								)
							}
							onRemoveFile={handleRemoveFile}
							onAddFile={handleAddFile}
							onSelectFile={(schemaId, file) => {
								// Add selected file to schema's mapped files
								handleAddFile(schemaId, file);
							}}
							uploadedFiles={uploadedFiles}
							onPreview={handlePreview}
							onPreviewUnion={handlePreviewUnion}
							chatContext={chatContext}
							onChatContext={onChatContext}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

export default DataMappingPanel;
