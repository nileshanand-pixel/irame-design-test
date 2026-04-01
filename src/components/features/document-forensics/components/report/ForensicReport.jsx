import RiskBadge from './RiskBadge';
import ScoreDonut from './ScoreDonut';
import ModuleCard from './ModuleCard';
import EvidenceChainTable from './EvidenceChainTable';
import { FORENSIC_MODULE_META } from '../../constants/forensics.constants';
import {
	Shield,
	FileText,
	DollarSign,
	Clock,
	AlertTriangle,
	Calculator,
	CalendarX,
	Bot,
	FileWarning,
} from 'lucide-react';

const formatElapsed = (createdAt, completedAt) => {
	if (!createdAt || !completedAt) return null;
	const parseTs = (ts) => new Date(ts);
	const seconds = Math.floor((parseTs(completedAt) - parseTs(createdAt)) / 1000);
	if (seconds < 0) return null;
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	if (mins === 0) return `${secs}s`;
	return `${mins}m ${secs}s`;
};

const ACTION_CONFIG = {
	ACCEPT: {
		color: 'text-emerald-700',
		bgColor: 'bg-emerald-50',
		label: 'Accept',
	},
	ACCEPT_WITH_NOTE: {
		color: 'text-blue-700',
		bgColor: 'bg-blue-50',
		label: 'Accept with Note',
	},
	REVIEW: {
		color: 'text-amber-700',
		bgColor: 'bg-amber-50',
		label: 'Review Required',
	},
	ESCALATE: {
		color: 'text-orange-700',
		bgColor: 'bg-orange-50',
		label: 'Escalate',
	},
	REJECT: { color: 'text-red-700', bgColor: 'bg-red-50', label: 'Reject' },
};

// Modules grouped by analysis category
const CONTENT_MODULES = new Set([
	'content_validation',
	'content_verifier',
	'gstin_verifier',
	'qr_scanner',
]);

/**
 * Extract human-readable key findings from module data.
 * Returns structured finding objects with icon, title, and description.
 */
const extractKeyFindings = (modules) => {
	const findings = [];
	const cv = modules?.content_validation;
	if (cv && cv.score < 70) {
		const flags = cv.flags || [];
		const details = cv.details || '';
		if (
			flags.includes('Amount-Mismatch') ||
			details.toLowerCase().includes('sum')
		) {
			findings.push({
				icon: Calculator,
				title: 'Amount Mismatch',
				description:
					details || 'Line items do not add up to the stated total',
				severity: 'CRITICAL',
			});
		}
		if (
			flags.includes('Future-Date') ||
			details.toLowerCase().includes('future')
		) {
			findings.push({
				icon: CalendarX,
				title: 'Date Issue',
				description: flags.includes('Future-Date')
					? 'Document contains a future date'
					: details,
				severity: 'CRITICAL',
			});
		}
		if (findings.length === 0 && (flags.length > 0 || details)) {
			findings.push({
				icon: FileWarning,
				title: 'Content Issue',
				description: flags.join('; ') || details,
				severity: cv.score < 30 ? 'CRITICAL' : 'HIGH',
			});
		}
	}

	const ts = modules?.truesight_analysis;
	if (ts && ts.score < 30) {
		const prob = ts.probability || 0;
		findings.push({
			icon: Bot,
			title: 'AI Generation Detected',
			description: `TrueSight: ${Math.round(prob)}% probability of synthetic generation`,
			severity: 'CRITICAL',
		});
	}

	return findings;
};

const SEVERITY_COLORS = {
	CRITICAL: 'border-red-200 bg-red-50',
	HIGH: 'border-orange-200 bg-orange-50',
};

const ForensicReport = ({ result }) => {
	const forensicResult = result?.result;
	if (!forensicResult) return null;

	const {
		composite_score: compositeScore,
		risk_level: riskLevel,
		primaryReason,
		recommended_action: recommendedAction,
		document_type_detected: docType,
		modules,
		evidence_chain: evidenceChain,
		confidence,
	} = forensicResult;

	const action = ACTION_CONFIG[recommendedAction] || ACTION_CONFIG.REVIEW;

	// Filter to only modules that actually ran (have data)
	const activeModules = Object.entries(modules || {}).filter(
		([, data]) => data && data.score != null,
	);

	// Sort by score ascending (most critical first)
	const sortedModules = [...activeModules].sort(
		(a, b) => (a[1].score ?? 100) - (b[1].score ?? 100),
	);

	// Group into content vs forensic
	const contentModules = sortedModules.filter(([key]) => CONTENT_MODULES.has(key));
	const forensicModules = sortedModules.filter(
		([key]) => !CONTENT_MODULES.has(key),
	);

	const keyFindings = extractKeyFindings(modules);

	return (
		<div className="space-y-6">
			{/* Executive Summary Card */}
			<div className="border rounded-xl p-6 bg-white">
				<div className="flex items-start gap-6">
					{/* Score Donut */}
					<ScoreDonut score={compositeScore} riskLevel={riskLevel} />

					{/* Summary Details */}
					<div className="flex-1 space-y-3">
						<div className="flex items-center gap-3">
							<RiskBadge riskLevel={riskLevel} size="lg" />
							<span
								className={`px-3 py-1 rounded-full text-sm font-medium ${action.color} ${action.bgColor}`}
							>
								{action.label}
							</span>
						</div>

						{/* Key Findings — structured bullets instead of raw text */}
						{keyFindings.length > 0 ? (
							<div className="space-y-1.5">
								<p className="text-xs font-medium text-primary40 uppercase tracking-wide">
									{keyFindings.length} critical finding
									{keyFindings.length > 1 ? 's' : ''}
								</p>
								{keyFindings.map((f, i) => (
									<div
										key={i}
										className="flex items-start gap-2 text-sm text-primary80"
									>
										<f.icon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
										<span>
											<strong>{f.title}:</strong>{' '}
											{f.description}
										</span>
									</div>
								))}
							</div>
						) : primaryReason ? (
							<p className="text-sm text-primary80">{primaryReason}</p>
						) : null}

						<div className="flex items-center gap-4 text-xs text-primary40">
							{docType && (
								<div className="flex items-center gap-1">
									<FileText className="w-3.5 h-3.5" />
									<span>{docType}</span>
								</div>
							)}
							{confidence != null && (
								<div className="flex items-center gap-1">
									<Shield className="w-3.5 h-3.5" />
									<span>{Math.round(confidence)}% confidence</span>
								</div>
							)}
							{formatElapsed(
								result?.createdAt,
								result?.completedAt,
							) && (
								<div className="flex items-center gap-1">
									<Clock className="w-3.5 h-3.5" />
									<span>
										Completed in{' '}
										{formatElapsed(
											result.createdAt,
											result.completedAt,
										)}
									</span>
								</div>
							)}
							{result?.llmCostUsd != null && (
								<div className="flex items-center gap-1">
									<DollarSign className="w-3.5 h-3.5" />
									<span>
										${result.llmCostUsd.toFixed(4)} LLM cost
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Key Findings Cards — prominent visual callout for critical issues */}
			{keyFindings.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{keyFindings.map((f, i) => (
						<div
							key={i}
							className={`border rounded-lg p-4 flex items-start gap-3 ${SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.HIGH}`}
						>
							<div className="p-2 rounded-lg bg-white/60">
								<f.icon className="w-5 h-5 text-red-600" />
							</div>
							<div className="flex-1 min-w-0">
								<h4 className="text-sm font-semibold text-gray-900">
									{f.title}
								</h4>
								<p className="text-sm text-gray-700 mt-0.5">
									{f.description}
								</p>
							</div>
							<span className="text-xs font-medium text-red-600 bg-white/60 px-2 py-0.5 rounded shrink-0">
								{f.severity}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Content Analysis Modules */}
			{contentModules.length > 0 && (
				<div>
					<h3 className="text-sm font-semibold text-primary80 mb-3 flex items-center gap-2">
						<FileText className="w-4 h-4" />
						Content Analysis ({contentModules.length})
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{contentModules.map(([key, data]) => (
							<ModuleCard
								key={key}
								moduleKey={key}
								moduleData={data}
							/>
						))}
					</div>
				</div>
			)}

			{/* Forensic Analysis Modules */}
			{forensicModules.length > 0 && (
				<div>
					<h3 className="text-sm font-semibold text-primary80 mb-3 flex items-center gap-2">
						<Shield className="w-4 h-4" />
						Forensic Analysis ({forensicModules.length})
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{forensicModules.map(([key, data]) => (
							<ModuleCard
								key={key}
								moduleKey={key}
								moduleData={data}
							/>
						))}
					</div>
				</div>
			)}

			{/* Evidence Chain */}
			<EvidenceChainTable evidenceChain={evidenceChain} />
		</div>
	);
};

export default ForensicReport;
