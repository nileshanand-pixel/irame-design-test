import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QueryStatusDropdown } from './QueryStatusDropdown';
import { RiskTypesDropdown } from './RiskTypesDropdown';
import {
	ArrowSquareOut,
	BoxArrowDown,
	ChartLineUp,
	Table,
	Trash,
} from '@phosphor-icons/react';
import Tooltip from '../components/Tooltip';
import { AddGraphModal } from './AddGraphModal';
import DotsDropdown from '@/components/elements/DotsDropdown';
import { QueryGraphs } from './QueryGraphs';
import { useMutation } from '@tanstack/react-query';
import { deleteReportCard } from '../service/reports.service';
import { Loader2, Eye, Copy } from 'lucide-react';
import {
	downloadCsvWithCustomName,
	getSupportedGraphs,
	getToken,
} from '@/lib/utils';
import { queryClient } from '@/lib/react-query';
import { toast } from 'sonner';
import { RiskLevelDropdown } from './RiskLevelDropdown';
import { Hint } from '@/components/Hint';
import { useReportPermission } from '@/contexts/ReportPermissionContext';
import { QuerySources } from './QuerySources';
import ReportComments from '../components/report-comments';

export const QueryCard = ({ report, card, pdfMode }) => {
	const queryNumber = card?.order_no || 1;
	const { isOwner } = useReportPermission();

	const [status, setStatus] = useState(card?.status || 'in_review');
	const [riskTypes, setRiskTypes] = useState(
		card?.risk_types_list || ['financial'],
	);
	const [riskLevel, setRiskLevel] = useState(card?.risk_level || 'medium');
	const [showAddGraph, setShowAddGraph] = useState(false);
	const [showGraphs, setShowGraphs] = useState(true);

	const deleteMutation = useMutation({
		mutationFn: deleteReportCard,
		onSuccess: () => {
			toast.success('Report card deleted successfully');
			queryClient.invalidateQueries(['report-details', report.report_id]);
		},
		onError: () => {
			toast.error('Failed to delete report card');
		},
	});

	const openQuery = () => {
		const url = `${window.location.origin}/app/new-chat/session/?sessionId=${card.session_id}&queryId=${card.query_id}`;
		window.open(url, '_blank');
	};

	const cardActions = [
		{
			type: 'item',
			label: 'Update Annexures',
			onClick: () => alert('implement update Annexures'),
			icon: <Table size={20} />,
			show: false,
		},
		{
			type: 'item',
			label: 'Open Query ',
			onClick: openQuery,
			icon: <ArrowSquareOut size={20} />,
			show: true,
		},
		{
			type: 'item',
			label: showGraphs ? 'Hide Graphs' : 'Show Graphs',
			onClick: () => setShowGraphs((prev) => !prev),
			icon: <Eye size={20} />,
			show: false,
		},
		{
			type: 'item',
			label: 'Copy Card ID',
			onClick: () => {
				navigator.clipboard.writeText(card.external_id);
				toast.success('Card ID copied to clipboard');
			},
			icon: <Copy size={20} />,
			show: true,
		},
		{
			type: 'item',
			label: 'Delete',
			onClick: () => {
				const ok = confirm('Are you sure you want to remove this card?');
				if (!ok) return;
				deleteMutation.mutate({
					token: getToken(),
					reportId: report.report_id,
					reportCardId: card.external_id,
				});
			},
			icon: deleteMutation.isPending ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<Trash size={20} />
			),
			show: !!isOwner,
		},
	];

	return (
		<Card className=" rounded-xl px-5 py-4 border shadow-sm bg-[#f9f8ff]">
			<CardHeader className="p-0">
				<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-2">
					<Badge
						variant="outline"
						className="px-3 py-2 font-semibold border-none rounded-full text-primary80 bg-purple-4"
					>
						QUERY&nbsp;{String(queryNumber).padStart(2, '0')}:
					</Badge>

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

					<div className="sm:ml-auto">
						<QueryStatusDropdown
							value={status}
							onChange={setStatus}
							reportCardId={card.external_id}
						/>
					</div>
				</div>

				<div className="flex  flex-col sm:flex-row sm:items-center sm:justify-between gap-16 border-b border-gray-200 pb-2 min-w-0">
					<CardTitle className="flex items-center gap-1 p-0 overflow-x-hidden text-base sm:text-lg md:text-xl lg:text-2xl font-medium lg:font-semibold text-primary80">
						<span className="truncate">
							{card?.title ?? 'Prescriptive analysis of this report'}
						</span>
						{!pdfMode && (
							<Hint label="Open Query" side="top">
								<Button
									variant="ghost"
									size="iconSm"
									className="text-gray-500 hover:text-gray-700 relative"
									onClick={openQuery}
								>
									<ArrowSquareOut className="size-6 shrink-0" />
								</Button>
							</Hint>
						)}
					</CardTitle>

					{!pdfMode && (
						<div className="flex shrink-0 items-center gap-3">
							<Tooltip content="Add Graph">
								<Button
									variant="ghost"
									size="iconSm"
									disabled={!isOwner}
									className="text-gray-500 hover:text-gray-700"
									onClick={() => setShowAddGraph(true)}
								>
									<ChartLineUp size={18} className="sm:size-20" />
								</Button>
							</Tooltip>
							<Tooltip content="Download">
								<Button
									variant="ghost"
									size="iconSm"
									className="text-gray-500 hover:text-gray-700"
									onClick={() => {
										const csvUrl =
											card?.data?.tables?.[0]?.csv_url;
										if (!csvUrl) return;

										downloadCsvWithCustomName({
											csvUrl,
											reportName: report.name,
											queryTitle: card.title ?? 'Untitled',
											queryId: card.query_id,
										});
									}}
								>
									<BoxArrowDown size={18} className="sm:size-20" />
								</Button>
							</Tooltip>
							<div className="relative">
								<DotsDropdown options={cardActions} align="start" />
							</div>
						</div>
					)}
				</div>
			</CardHeader>

			<CardContent className="p-0 flex flex-col gap-2 pt-2">
				{showGraphs && (
					<QueryGraphs
						graphs={card.data.graphs}
						reportCardId={card.external_id}
					/>
				)}
				<div className="pl-8">
					<div
						className="text-primary80"
						style={{ whiteSpace: 'pre-wrap' }}
						dangerouslySetInnerHTML={{
							__html: card?.data?.answer || '',
						}}
					/>
				</div>
				<QuerySources
					queryCardId={card.external_id}
					reportId={report.report_id}
				/>
				<ReportComments
					withTrigger={true}
					reportId={report.report_id}
					reportCardId={card.external_id}
				/>
			</CardContent>

			{/* ---------- footer ---------- */}
			{/* TODO -> Implement in milestone 2 */}
			{/* <CardFooter className=" flex flex-col sm:flex-row sm:items-center mt-2 sm:justify-between gap-3">
				<div className="flex pl-2 items-center">
					<div className="flex -space-x-2">
						<div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white" />
						<div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white" />
						<div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white" />
					</div>
					<span className="ml-2 font-medium text-[#6a3bff]">
						+3 sources
					</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="text-gray-400 hover:text-gray-600"
				>
					<PlusCircle size={24} />
				</Button>
			</CardFooter> */}
			{showAddGraph && (
				<AddGraphModal
					onClose={() => setShowAddGraph(false)}
					reportCardId={card.external_id}
					graphs={getSupportedGraphs(card.data.graphs)}
					open={showAddGraph}
				/>
			)}
		</Card>
	);
};
