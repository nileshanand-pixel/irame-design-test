import { useState, useEffect } from 'react';
import {
	Play,
	Upload,
	FileText,
	CheckCircle2,
	AlertTriangle,
	Loader2,
	ArrowRight,
	RotateCcw,
	BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getWorkflow, incrementRunCount } from '../lib/storage';
import { runWorkflow } from '../lib/mock-api';

const SEV = {
	low: {
		bar: 'bg-emerald-400',
		badge: 'bg-emerald-100 text-emerald-700',
		label: 'Low',
	},
	medium: {
		bar: 'bg-amber-400',
		badge: 'bg-amber-100 text-amber-700',
		label: 'Medium',
	},
	high: {
		bar: 'bg-orange-400',
		badge: 'bg-orange-100 text-orange-700',
		label: 'High',
	},
	critical: {
		bar: 'bg-red-500',
		badge: 'bg-red-100 text-red-700',
		label: 'Critical',
	},
};
const RISK_BADGE = {
	low: 'bg-emerald-100 text-emerald-700',
	medium: 'bg-amber-100 text-amber-700',
	high: 'bg-orange-100 text-orange-700',
	critical: 'bg-red-100 text-red-700',
};
const STAGES = [
	'Uploading files…',
	'Processing inputs…',
	'Running analysis…',
	'Generating findings…',
];
const TYPE_COLOR = {
	csv: 'bg-emerald-100 text-emerald-700',
	pdf: 'bg-rose-100 text-rose-700',
	image: 'bg-violet-100 text-violet-700',
	sql: 'bg-amber-100 text-amber-700',
};

function makeDummyFile(input) {
	const name = input.name.toLowerCase().replace(/\s+/g, '_');
	const ext =
		input.type === 'pdf' ? 'pdf' : input.type === 'image' ? 'png' : 'csv';
	const content =
		input.type === 'csv'
			? 'id,name,amount,date,status\n1,Sample A,48000,2026-01-15,approved\n2,Sample B,92500,2026-01-18,pending'
			: `Sample ${input.type} content for ${input.name}`;
	return new File([content], `${name}_sample.${ext}`, {
		type: input.type === 'pdf' ? 'application/pdf' : 'text/plain',
	});
}

const WorkflowRun = ({ workflowId, onBack, onViewAnalytics }) => {
	const [workflow, setWorkflow] = useState(null);
	const [step, setStep] = useState('map_files'); // map_files | run
	const [fileMap, setFileMap] = useState({});
	const [isRunning, setIsRunning] = useState(false);
	const [runStage, setRunStage] = useState(0);
	const [result, setResult] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		const wf = getWorkflow(workflowId);
		if (!wf) return;
		setWorkflow(wf);
		// Auto-populate dummy files
		const dummy = {};
		wf.inputs.forEach((inp) => {
			dummy[inp.id] = makeDummyFile(inp);
		});
		setFileMap(dummy);
	}, [workflowId]);

	async function handleRun() {
		setIsRunning(true);
		setResult(null);
		setError(null);
		setRunStage(0);
		const interval = setInterval(() => {
			setRunStage((s) => (s < STAGES.length - 2 ? s + 1 : s));
		}, 900);
		try {
			const data = await runWorkflow(workflow);
			clearInterval(interval);
			setRunStage(STAGES.length - 1);
			setResult(data);
			incrementRunCount(workflowId);
		} catch (e) {
			clearInterval(interval);
			setError(e.message);
		} finally {
			setIsRunning(false);
		}
	}

	if (!workflow) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<Loader2 className="size-6 text-purple-100 animate-spin" />
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full min-h-0">
			{/* Header */}
			<div className="px-6 py-4 border-b border-white/60 flex-shrink-0">
				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="text-xs text-primary40 font-medium uppercase tracking-wide">
							{workflow.category}
						</p>
						<h2 className="font-semibold text-primary100">
							{workflow.name}
						</h2>
					</div>
					<div className="flex items-center gap-2 text-xs text-primary40">
						<span>{workflow.inputs.length} inputs</span>
						<span>·</span>
						<span>{workflow.steps.length} steps</span>
						<span>·</span>
						<span>{workflow.runCount ?? 0} runs</span>
					</div>
				</div>

				{/* Step progress */}
				<div className="flex items-center gap-2 mt-4">
					{['Map Files', 'Run Workflow'].map((label, i) => {
						const stepKey = ['map_files', 'run'][i];
						const isDone =
							(step === 'run' && i === 0) || (result && i <= 1);
						const isCurrent = step === stepKey && !result;
						return (
							<div key={label} className="flex items-center gap-2">
								<div
									className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
										isDone
											? 'bg-emerald-100 text-emerald-700'
											: isCurrent
												? 'bg-[rgba(106,18,205,0.10)] text-purple-100'
												: 'bg-white/50 text-primary40'
									}`}
								>
									{isDone && <CheckCircle2 className="size-3" />}
									{label}
								</div>
								{i < 1 && (
									<ArrowRight className="size-3 text-primary20" />
								)}
							</div>
						);
					})}
				</div>
			</div>

			<div className="flex-1 overflow-auto px-6 py-5 min-h-0 space-y-5">
				{/* Map Files step */}
				{step === 'map_files' && (
					<>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-semibold text-primary100">
									File Mapping
								</h3>
								<p className="text-sm text-primary40 mt-0.5">
									Ira has automatically matched your files to the
									workflow inputs
								</p>
							</div>
							<span className="text-[10px] font-semibold bg-[rgba(106,18,205,0.08)] text-purple-100 px-2.5 py-1 rounded-full border border-[rgba(106,18,205,0.12)]">
								AI-SUGGESTED
							</span>
						</div>

						<div className="space-y-3">
							{workflow.inputs.map((inp) => {
								const file = fileMap[inp.id];
								return (
									<div
										key={inp.id}
										className="bg-white/60 border border-white/70 rounded-2xl overflow-hidden"
									>
										<div className="grid grid-cols-2 divide-x divide-white/60">
											<div className="px-5 py-4 bg-slate-50/50">
												<p className="text-[10px] text-primary40 font-semibold uppercase tracking-wide mb-2">
													Expected Schema
												</p>
												<div className="flex items-center gap-2 mb-1">
													<span
														className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${TYPE_COLOR[inp.type] ?? ''}`}
													>
														{inp.type}
													</span>
													<p className="text-sm font-semibold text-primary100">
														{inp.name}
													</p>
												</div>
												<p className="text-xs text-primary40 leading-relaxed">
													{inp.description}
												</p>
											</div>
											<div className="px-5 py-4">
												<div className="flex items-center justify-between mb-2">
													<p className="text-[10px] text-primary40 font-semibold uppercase tracking-wide">
														Mapped Source
													</p>
													<span className="text-[10px] font-bold text-emerald-700">
														98% MATCH
													</span>
												</div>
												<div className="flex items-center gap-2">
													<FileText className="size-4 text-primary40 flex-shrink-0" />
													<p className="text-sm text-primary80 truncate font-medium flex-1">
														{file?.name}
													</p>
													<label className="text-xs text-purple-100 hover:text-[#5a0fb0] cursor-pointer font-medium transition-colors flex-shrink-0">
														Change
														<input
															type="file"
															className="hidden"
															onChange={(e) => {
																if (
																	e.target
																		.files?.[0]
																)
																	setFileMap(
																		(prev) => ({
																			...prev,
																			[inp.id]:
																				e
																					.target
																					.files[0],
																		}),
																	);
															}}
														/>
													</label>
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>

						<div className="flex items-center justify-between pt-2">
							<p className="text-xs text-primary40">
								Review each mapping carefully before proceeding.
							</p>
							<Button
								onClick={() => setStep('run')}
								className="bg-[#26064A] hover:bg-[#3a0d6e] text-white rounded-xl gap-2"
							>
								Confirm & Run Workflow
								<ArrowRight className="size-4" />
							</Button>
						</div>
					</>
				)}

				{/* Run step */}
				{step === 'run' && !result && (
					<div className="flex flex-col items-center justify-center gap-6 pt-12 pb-8">
						<div className="w-16 h-16 rounded-2xl bg-[rgba(106,18,205,0.08)] flex items-center justify-center">
							<Play className="size-8 text-purple-100" />
						</div>
						<div className="text-center">
							<h3 className="font-semibold text-primary100 text-lg">
								{workflow.name}
							</h3>
							<p className="text-sm text-primary40 mt-1">
								{Object.keys(fileMap).length} files ready ·{' '}
								{workflow.steps.length} steps
							</p>
						</div>

						{isRunning ? (
							<div className="w-full max-w-sm space-y-3">
								<div className="flex items-center gap-3">
									<Loader2 className="size-4 text-purple-100 animate-spin flex-shrink-0" />
									<span className="text-sm text-primary80">
										{STAGES[runStage]}
									</span>
									<span className="text-xs text-primary40 ml-auto">
										{runStage + 1}/{STAGES.length}
									</span>
								</div>
								<div className="w-full bg-white/60 rounded-full h-1.5 border border-white/60">
									<div
										className="bg-purple-100 h-1.5 rounded-full transition-all duration-700"
										style={{
											width: `${((runStage + 1) / STAGES.length) * 100}%`,
										}}
									/>
								</div>
								<div className="flex gap-1">
									{STAGES.map((_, i) => (
										<div
											key={i}
											className={`flex-1 h-1 rounded-full transition-colors ${i <= runStage ? 'bg-purple-100' : 'bg-white/50 border border-white/60'}`}
										/>
									))}
								</div>
							</div>
						) : (
							<Button
								onClick={handleRun}
								size="lg"
								className="bg-purple-100 hover:bg-[#5a0fb0] text-white rounded-xl gap-2 shadow-[0_4px_16px_rgba(106,18,205,0.3)] px-8"
							>
								<Play className="size-5" />
								Run Audit
							</Button>
						)}

						{error && (
							<div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4 max-w-sm w-full">
								<AlertTriangle className="size-4 text-red-500 flex-shrink-0 mt-0.5" />
								<p className="text-sm text-red-700">{error}</p>
							</div>
						)}
					</div>
				)}

				{/* Results */}
				{result && (
					<div className="space-y-5">
						{/* Metrics */}
						<div className="flex items-center justify-between">
							<h3 className="font-semibold text-primary100">
								Audit Results
							</h3>
							<span
								className={`text-xs font-semibold px-3 py-1 rounded-full ${RISK_BADGE[result.metrics?.risk_level ?? 'low']}`}
							>
								{(result.metrics?.risk_level ?? 'low').toUpperCase()}{' '}
								RISK
							</span>
						</div>

						<div className="grid grid-cols-3 gap-3">
							<div className="bg-white/60 border border-white/70 rounded-2xl p-4 text-center">
								<div className="text-2xl font-bold text-primary100">
									{Number(
										result.metrics?.records_analyzed,
									).toLocaleString()}
								</div>
								<div className="text-xs text-primary40 mt-0.5">
									Records Analyzed
								</div>
							</div>
							<div className="bg-white/60 border border-white/70 rounded-2xl p-4 text-center">
								<div className="text-2xl font-bold text-rose-600">
									{result.metrics?.issues_found}
								</div>
								<div className="text-xs text-primary40 mt-0.5">
									Issues Found
								</div>
							</div>
							<div
								className={`rounded-2xl p-4 text-center ${RISK_BADGE[result.metrics?.risk_level ?? 'low']}`}
							>
								<div className="text-2xl font-bold capitalize">
									{result.metrics?.risk_level}
								</div>
								<div className="text-xs opacity-70 mt-0.5">
									Risk Level
								</div>
							</div>
						</div>

						{/* Summary */}
						<div className="bg-[rgba(106,18,205,0.04)] border border-[rgba(106,18,205,0.12)] rounded-2xl p-4">
							<p className="text-xs font-semibold text-purple-100 mb-1">
								Executive Summary
							</p>
							<p className="text-sm text-primary80 leading-relaxed">
								{result.summary}
							</p>
						</div>

						{/* Flags */}
						{result.type === 'flags' && result.flags && (
							<div className="bg-white/60 border border-white/70 rounded-2xl overflow-hidden">
								<div className="px-5 py-4 border-b border-white/60 flex items-center justify-between">
									<h4 className="font-semibold text-primary100">
										Findings ({result.flags.length})
									</h4>
									<div className="flex gap-1.5">
										{['critical', 'high', 'medium', 'low'].map(
											(sev) => {
												const count = result.flags.filter(
													(f) => f.severity === sev,
												).length;
												return count ? (
													<span
														key={sev}
														className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SEV[sev].badge}`}
													>
														{count} {sev}
													</span>
												) : null;
											},
										)}
									</div>
								</div>
								<div className="divide-y divide-white/40">
									{result.flags.map((flag) => {
										const s = SEV[flag.severity] ?? SEV.medium;
										return (
											<div
												key={flag.id}
												className={`px-5 py-4 border-l-4 ${s.bar.replace('bg-', 'border-l-')}`}
											>
												<div className="flex items-center gap-2 mb-1.5">
													<span
														className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.badge}`}
													>
														{s.label}
													</span>
													{flag.reference && (
														<span className="text-[10px] text-primary40 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
															{flag.reference}
														</span>
													)}
												</div>
												<p className="text-sm text-primary100">
													{flag.description}
												</p>
												{flag.recommendation && (
													<p className="text-xs text-primary60 mt-1.5 flex items-start gap-1">
														<span className="text-primary40 font-bold">
															→
														</span>{' '}
														{flag.recommendation}
													</p>
												)}
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Table */}
						{result.type === 'table' && result.table && (
							<div className="bg-white/60 border border-white/70 rounded-2xl overflow-hidden">
								<div className="px-5 py-4 border-b border-white/60">
									<h4 className="font-semibold text-primary100">
										{result.title}
									</h4>
								</div>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="bg-slate-50/50">
												{result.table.headers.map((h) => (
													<th
														key={h}
														className="text-left px-4 py-3 text-[10px] font-semibold text-primary40 uppercase tracking-wider whitespace-nowrap border-b border-white/60"
													>
														{h}
													</th>
												))}
											</tr>
										</thead>
										<tbody className="divide-y divide-white/40">
											{result.table.rows.map((row, i) => (
												<tr
													key={i}
													className="hover:bg-white/40 transition-colors"
												>
													{row.map((cell, j) => (
														<td
															key={j}
															className="px-4 py-3 text-xs text-primary80"
														>
															{cell}
														</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* Actions */}
						<div className="flex items-center justify-center gap-4 pt-2">
							<button
								onClick={() => {
									setResult(null);
									setStep('map_files');
								}}
								className="flex items-center gap-1.5 text-sm text-primary40 hover:text-primary80 transition-colors"
							>
								<RotateCcw className="size-3.5" /> Run again with
								different files
							</button>
							{onViewAnalytics && (
								<Button
									onClick={onViewAnalytics}
									className="bg-purple-100 hover:bg-[#5a0fb0] text-white rounded-xl gap-2"
								>
									<BarChart3 className="size-4" />
									View Analytics
								</Button>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default WorkflowRun;
