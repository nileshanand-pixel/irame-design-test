import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QueryStatusDropdown } from './QueryStatusDropdown';
import { RiskTypesDropdown } from './RiskTypesDropdown';
import { ArrowSquareOut, ChartLineUp, Table, Trash } from '@phosphor-icons/react';
import { AddGraphModal } from './AddGraphModal';
import DotsDropdown from '@/components/elements/DotsDropdown';
import { QueryGraphs } from './QueryGraphs';
import { useMutation } from '@tanstack/react-query';
import { deleteReportCard, generateCases } from '../service/reports.service';
import { Loader2, Eye, Copy } from 'lucide-react';
import { cn, getInitials, getSupportedGraphs } from '@/lib/utils';
import { queryClient } from '@/lib/react-query';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { RiskLevelDropdown } from './RiskLevelDropdown';
import { useReportPermission } from '@/contexts/ReportPermissionContext';
import { QuerySourcesAndComments } from './QuerySourcesAndComments';
import useS3File from '@/hooks/useS3File';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import redirectIcon from '@/assets/icons/redirect.svg';
import { useSearchParams } from 'react-router-dom';
import FlagExceptionsModal from './flag-exception-modal';
import Kpis from './kpis';
import { FiDownload, FiFlag } from 'react-icons/fi';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { CASE_GENERATION_STATUS } from '../constants';

export const QueryCard = ({
	report,
	card,
	pdfMode,
	reportCardsCaseGenerationStatus,
}) => {
	const queryNumber = card?.order_no || 1;
	const { isOwner } = useReportPermission();
	const [searchParams, setSearchParams] = useSearchParams();
	const [cardStatus, setCardStatus] = useState(
		reportCardsCaseGenerationStatus?.[card.external_id],
	);

	const [status, setStatus] = useState(card?.status || 'in_review');
	const [riskTypes, setRiskTypes] = useState(
		card?.risk_types_list || ['financial'],
	);
	const [riskLevel, setRiskLevel] = useState(card?.risk_level || 'medium');
	const [showAddGraph, setShowAddGraph] = useState(false);
	const [showGraphs, setShowGraphs] = useState(true);
	const [showFlagExceptionsModal, setShowFlagExceptionsModal] = useState(false);

	const { isDownloading, downloadS3File } = useS3File();
	const [ConfirmationDialog, confirm] = useConfirmDialog();

	useEffect(() => {
		setCardStatus(reportCardsCaseGenerationStatus?.[card.external_id]);
	}, [reportCardsCaseGenerationStatus, card.external_id]);
	// Check URL for card_id on mount and when searchParams change
	useEffect(() => {
		if (searchParams.get('card_id') === card.external_id) {
			setShowFlagExceptionsModal(true);
		}
	}, [searchParams, card.external_id]);

	const deleteMutation = useMutation({
		mutationFn: deleteReportCard,
		onSuccess: () => {
			toast.success('Report card deleted successfully');
			queryClient.invalidateQueries(['report-details', report.report_id]);
		},
		onError: (error) => {
			logError(error, {
				feature: 'reports',
				action: 'delete-report-card',
				reportId: report?.report_id,
				reportCardId: card?.external_id,
			});
			toast.error('Failed to delete report card');
		},
	});

	const generateCasesMutation = useMutation({
		mutationFn: generateCases,
		onSuccess: () => {
			queryClient.invalidateQueries(['report-details', report.report_id]);
			queryClient.invalidateQueries([
				'report-cards-case-generation-status',
				report.report_id,
			]);
		},
		onError: (error) => {
			setCardStatus(reportCardsCaseGenerationStatus?.[card.external_id]);
			logError(error, {
				feature: 'reports',
				action: 'generate-cases',
				reportId: report?.report_id,
				cardId: card?.external_id,
			});
			toast.error(
				error?.response?.data?.message || 'Failed to generate cases',
			);
		},
	});

	const handleGenerateCases = () => {
		setCardStatus(CASE_GENERATION_STATUS.GENERATING);
		generateCasesMutation.mutate({
			reportId: report.report_id,
			cardId: card.external_id,
		});
	};

	const openQuery = () => {
		const url = `${window.location.origin}/app/new-chat/session/?sessionId=${card.session_id}&queryId=${card.query_id}&source=report&datasource_id=${card.datasource_id}`;
		window.open(url, '_blank');
	};

	const handleDownloadQuery = () => {
		const csvUrl = card?.data?.tables?.[0]?.csv_url;
		if (!csvUrl || isDownloading) return;

		const truncatedTitle = (card.title ?? 'Untitled')
			.replace(/\s+/g, '_')
			.slice(0, 20);
		const fileName = `${report?.name}_${truncatedTitle}_${card.query_id}.csv`;
		downloadS3File(csvUrl, fileName);
	};

	const handleFlagExceptions = () => {
		// Add card_id to URL
		setSearchParams(
			(prev) => {
				const newParams = new URLSearchParams(prev);
				newParams.set('card_id', card.external_id);
				return newParams;
			},
			{ replace: true },
		);
		setShowFlagExceptionsModal(true);
	};

	const handleCloseFlagExceptions = () => {
		setShowFlagExceptionsModal(false);
		// Remove card_id from URL
		setSearchParams(
			(prev) => {
				const newParams = new URLSearchParams(prev);
				newParams.delete('card_id');
				return newParams;
			},
			{ replace: true },
		);
	};

	const cardActions = [
		{
			type: 'item',
			label: 'Update Annexures',
			onClick: () => alert('implement update Annexures'),
			icon: <Table className="size-5" />,
			show: false,
		},
		{
			type: 'item',
			label: 'Open Query ',
			onClick: openQuery,
			icon: <ArrowSquareOut className="size-5" />,
			show: isOwner,
		},
		{
			type: 'item',
			label: showGraphs ? 'Hide Graphs' : 'Show Graphs',
			onClick: () => setShowGraphs((prev) => !prev),
			icon: <Eye className="size-5" />,
			show: false,
		},
		{
			type: 'item',
			label: 'Copy Card ID',
			onClick: () => {
				navigator.clipboard.writeText(card.external_id);
				toast.success('Card ID copied to clipboard');
			},
			icon: <Copy className="size-5" />,
			show: true,
		},
		{
			type: 'item',
			label: 'Add Graph',
			icon: <ChartLineUp className="size-6" />,
			show: isOwner,
			onClick: () => setShowAddGraph(true),
		},
		{
			type: 'item',
			label: 'Download',
			icon: <FiDownload className="size-5 text-[#26064A99]" />,
			show: true,
			onClick: handleDownloadQuery,
		},
		{
			type: 'item',
			label: 'Delete',
			onClick: async () => {
				const confirmed = await confirm({
					header: 'Remove Query Card?',
					description:
						'This will permanently remove this query card from the report. This action cannot be undone.',
				});
				if (!confirmed) return;
				deleteMutation.mutate({
					reportId: report.report_id,
					reportCardId: card.external_id,
				});
			},
			icon: deleteMutation.isPending ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<Trash className="size-5" />
			),
			show: !!isOwner,
		},
	];

	const answerContent = (
		<div
			className="text-primary80"
			style={{ whiteSpace: 'pre-wrap' }}
			dangerouslySetInnerHTML={{
				__html: card?.data?.answer || '',
			}}
		/>
	);
	const renderCaseRelatedCta = () => {
		if (cardStatus === CASE_GENERATION_STATUS.GENERATING) {
			return (
				<Button variant="outline" size="sm" disabled={true}>
					<div className="flex gap-2 items-center">
						<CircularLoader size="sm" />
						<span>Generating cases...</span>
					</div>
				</Button>
			);
		}

		if (cardStatus === CASE_GENERATION_STATUS.FAILED) {
			return (
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-md border border-red-200">
						<div className="flex items-center gap-1.5">
							<span className="text-red-700 text-xs font-medium">
								Generation failed
							</span>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={handleGenerateCases}
						className="flex items-center gap-1.5 border-red-200 hover:bg-red-50 disabled:pointer-events-auto disabled:cursor-not-allowed"
						disabled={!isOwner}
					>
						<svg
							className="size-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						<span className="text-xs">Retry</span>
					</Button>
				</div>
			);
		}

		if (cardStatus === CASE_GENERATION_STATUS.NOT_GENERATED) {
			return (
				<Button
					variant="outline"
					size="sm"
					onClick={handleGenerateCases}
					disabled={!isOwner}
					className="disabled:pointer-events-auto disabled:cursor-not-allowed"
				>
					Generate Cases
				</Button>
			);
		}

		if (CASE_GENERATION_STATUS.GENERATED === cardStatus) {
			return (
				<Button
					variant="outline"
					size="sm"
					className="flex items-center gap-2"
					onClick={handleFlagExceptions}
				>
					<FiFlag className="size-4 text-[#26064A99]" />
					<span className="text-[#26064ACC] text-xs">
						Manage Exceptions
					</span>
					<div className="w-[0.0625rem] h-5 bg-[#26064A66]"></div>
					<img src={redirectIcon} alt="flag icon" className="size-4" />
				</Button>
			);
		}
	};

	return (
		<Card
			className={cn(
				'rounded-xl px-6 py-4 border border-[#F4EFF9] shadow-sm hover:shadow-md hover:border-[#6A12CD33] transition-all duration-300 query-card',
				pdfMode && 'block pdf-mode-card',
			)}
		>
			<ConfirmationDialog />
			<CardHeader className="p-0 pb-3 border-b-1 border-[#26064A1A]">
				<div className="flex flex-row flex-wrap items-center gap-3 mb-3">
					<Badge
						variant="outline"
						className="px-3 py-3 font-semibold border-none rounded-full text-[#26064ACC] bg-[#6A12CD0A] text-xs"
					>
						QUERY&nbsp;{String(queryNumber).padStart(2, '0')}
					</Badge>

					<QueryStatusDropdown
						value={status}
						onChange={setStatus}
						reportCardId={card.external_id}
					/>

					<RiskTypesDropdown
						value={riskTypes[0] || 'financial'}
						riskLevel={riskLevel}
						reportId={report.report_id}
						reportCardId={card.external_id}
					/>

					<RiskLevelDropdown
						value={riskLevel}
						riskTypes={riskTypes}
						reportId={report.report_id}
						reportCardId={card.external_id}
					/>

					{!pdfMode && (
						<div className="sm:ml-auto">
							<DotsDropdown options={cardActions} align="end" />
						</div>
					)}
				</div>

				<CardTitle
					className={`p-0 text-xl font-semibold text-primary80 ${pdfMode ? 'break-words' : 'truncate'}`}
				>
					{card?.title ?? 'Prescriptive analysis of this report'}
				</CardTitle>

				<div className="flex items-center justify-between pt-2">
					<div className="flex items-center gap-2">
						<div className="text-[#26064A99] text-sm">Added by:</div>

						<div className="flex items-center gap-1">
							<Avatar className="size-8">
								<AvatarFallback className="text-sm font-medium">
									{getInitials(card?.added_by)}
								</AvatarFallback>
							</Avatar>

							<div className="capitalize text-[#26064ACC] font-medium text-sm">
								{card?.added_by}
							</div>
						</div>
					</div>
					{!pdfMode && renderCaseRelatedCta()}
				</div>
			</CardHeader>

			<CardContent
				className={cn(
					'p-0 flex flex-col gap-2 pt-3',
					pdfMode && 'block space-y-2',
				)}
			>
				<div className="mb-4">
					<Kpis kpisData={card?.kpis} />
				</div>

				{pdfMode ? (
					<>
						<div>{answerContent}</div>
						{showGraphs && (
							<QueryGraphs
								graphs={card.data.graphs}
								reportCardId={card.external_id}
								pdfMode={pdfMode}
								tables={card.data.tables}
							/>
						)}
					</>
				) : (
					<>
						{showGraphs && (
							<QueryGraphs
								graphs={card.data.graphs}
								reportCardId={card.external_id}
								pdfMode={pdfMode}
								tables={card.data.tables}
							/>
						)}
						<div>{answerContent}</div>
					</>
				)}

				<QuerySourcesAndComments
					queryCardId={card.external_id}
					reportId={report.report_id}
					reportCardId={card.external_id}
					pdfMode={pdfMode}
				/>

				{/* <ReportComments
					withTrigger={true}
					reportId={report.report_id}
					reportCardId={card.external_id}
					onTriggerClick={() => {}}
				/> */}
			</CardContent>

			{showAddGraph && (
				<AddGraphModal
					onClose={() => setShowAddGraph(false)}
					reportCardId={card.external_id}
					graphs={getSupportedGraphs(card.data.graphs)}
					open={showAddGraph}
				/>
			)}

			<FlagExceptionsModal
				open={showFlagExceptionsModal}
				onClose={handleCloseFlagExceptions}
				reportId={report?.report_id}
				cardId={card?.external_id}
			/>
		</Card>
	);
};
