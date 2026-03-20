import RiskBadge from './RiskBadge';
import ScoreDonut from './ScoreDonut';
import ModuleCard from './ModuleCard';
import EvidenceChainTable from './EvidenceChainTable';
import { FORENSIC_MODULE_META } from '../../constants/forensics.constants';
import { Shield, FileText, DollarSign, Clock } from 'lucide-react';

const formatElapsed = (createdAt, completedAt) => {
	if (!createdAt || !completedAt) return null;
	const parseTs = (ts) =>
		new Date(typeof ts === 'string' && !ts.endsWith('Z') ? ts + 'Z' : ts);
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

						{primaryReason && (
							<p className="text-sm text-primary80">{primaryReason}</p>
						)}

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

			{/* Module Grid */}
			{activeModules.length > 0 && (
				<div>
					<h3 className="text-sm font-semibold text-primary80 mb-3">
						Analysis Modules ({activeModules.length})
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{activeModules.map(([key, data]) => (
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
