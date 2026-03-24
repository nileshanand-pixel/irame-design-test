import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import upperFirst from 'lodash.upperfirst';
import { useNavigate, useParams } from 'react-router-dom';
import GradientSpinner from '@/components/elements/loading/GradientSpinner';

const WorkflowCard = ({
	workflow,
	statusMap,
	isHighlighted = false,
	isHighlightVisible = false,
	highlightedRef = null,
}) => {
	const { businessProcessId } = useParams();
	const navigate = useNavigate();

	const processingInfo = statusMap?.[workflow.external_id];
	const rawStatus = (processingInfo?.status || workflow.status || '').toString();
	const normalizedStatus = rawStatus.replace(/-$/, '').toUpperCase();

	const isActive = normalizedStatus === 'ACTIVE';
	const isInactive = normalizedStatus === 'INACTIVE';
	const isFailed = normalizedStatus.includes('FAILED');
	const isProcessing =
		normalizedStatus === 'IN_PROGRESS' ||
		normalizedStatus.includes('PROCESSING') ||
		normalizedStatus === 'CODE_PROCESSING';

	// Show loader for any non-active/non-inactive/non-processed states
	const showLoader = !(
		isActive ||
		isInactive ||
		normalizedStatus.includes('PROCESSED')
	);

	const clickable = !isProcessing && !isFailed;

	const cardClass =
		isFailed || isInactive
			? 'bg-gray-50 text-gray-600'
			: 'bg-purple-2 text-primary80';

	// Tag badges should keep their normal color unless the workflow is active.
	const tagBadgeClass = isActive
		? 'bg-primary4 text-primary60'
		: 'bg-misc-black4 text-black60';

	// Status badge should use the same styling as other tags (do not change color on failed)
	const statusBadgeClass = tagBadgeClass;

	const workflowType = workflow?.data?.type?.toUpperCase();
	const isSqlWorkflow = workflowType === 'SQL_WORKFLOW';

	const handleCardClick = (externalId) => {
		if (!clickable) return;
		navigate(
			`/app/business-process/${businessProcessId}/workflows/${externalId}`,
		);
	};

	const statusLabel = normalizedStatus
		.split(/[_ ]+/)
		.map((s) => upperFirst(s.toLowerCase()))
		.join(' ');

	return (
		<Card
			ref={highlightedRef}
			className={`mb-4 ${cardClass} hover:bg-[#F9F6FD]/80 border-[0.093rem] ${clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-95'} ${
				isHighlightVisible
					? 'border-primary animate-highlight-border'
					: 'border-primary16/0 hover:border-primary16'
			}`}
			onClick={() => handleCardClick(workflow.external_id)}
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-12 w-full">
					<div className="flex items-start gap-4 flex-1 min-w-0">
						<span className="material-symbols-outlined text-3xl">
							splitscreen_add
						</span>
						<div className="flex flex-col gap-1 min-w-0">
							<div className="flex items-center gap-6">
								<p
									className="text-base font-medium truncate"
									title={upperFirst(workflow.name)}
								>
									{upperFirst(workflow.name)}
								</p>
								{isSqlWorkflow && (
									<div className="flex items-center shrink-0">
										<span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
											<span className="size-2 bg-green-600 rounded-full animate-pulse"></span>
											Live
										</span>
									</div>
								)}
							</div>
							<p
								className="mb-1 text-sm truncate"
								title={upperFirst(workflow.description)}
							>
								{upperFirst(workflow.description)}
							</p>
							<div className="flex gap-2">
								{workflow.tags.map((tag, index) => (
									<Badge
										key={index}
										variant="outline"
										className={`px-2 py-[0.125rem] text-xs font-medium ${tagBadgeClass} border-none`}
									>
										{upperFirst(tag)}
									</Badge>
								))}
								<Badge
									variant="outline"
									className={`flex justify-center text-xs items-center border-none font-medium ${statusBadgeClass}`}
								>
									{statusLabel}
									<span className="material-symbols-outlined text-base">
										keyboard_arrow_down
									</span>
								</Badge>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-3 shrink-0">
						{isFailed ? (
							<div className="flex items-center gap-2 text-red-600">
								<span className="material-symbols-outlined text-2xl">
									error
								</span>
								<span className="text-sm">{statusLabel}</span>
							</div>
						) : showLoader ? (
							<div className="flex items-center gap-4">
								<GradientSpinner size={20} />
								<span className="text-primary80 font-medium text-sm">
									Workflow under processing...
								</span>
							</div>
						) : null}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default WorkflowCard;
