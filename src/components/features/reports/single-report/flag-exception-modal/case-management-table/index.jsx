import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import TextCell from './cells/text-cell';
import FlaggingCell from './cells/flagging-cell';
import SeverityCell from './cells/Severity-cell';
import DateCell from './cells/date-cell';
import StatusCell from './cells/status-cell';
import UsersCell from './cells/users-cell';
import CommentsCell from './cells/comments-cell';
import UserCell from './cells/user-cell';
import { updateReportCardCase } from '../../../service/reports.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import {
	createColumnsConfig,
	PRE_DEFINED_COLUMN_KEYS,
	transformCasesDataToTableRows,
} from '../helper';
import ResolutionTrailModal from '../../../ResolutionTrailModal';
import { useRouter } from '@/hooks/useRouter';
import { cn } from '@/lib/utils';

export default function CaseManagementTable({
	isLoadingCases,
	casesData,
	selectedCaseIds,
	setSelectedCaseIds,
	reportId,
	cardId,
	isSample = false,
}) {
	const [resolutionTrailModalOpen, setResolutionTrailModalOpen] = useState(false);
	const [updatingCell, setUpdatingCell] = useState(null); // { caseId, columnKey }
	const queryClient = useQueryClient();
	const { navigate, location } = useRouter();

	const handleCloseResolutionTrail = () => {
		setResolutionTrailModalOpen(false);
		const params = new URLSearchParams(location.search);
		params.delete('case_id');
		navigate(`${location.pathname}?${params.toString()}`, { replace: true });
	};

	const handleOpenResolutionTrail = (tableRowData) => {
		setResolutionTrailModalOpen(true);
		const params = new URLSearchParams(location.search);
		params.set('case_id', tableRowData.case_id);
		navigate(`${location.pathname}?${params.toString()}`, { replace: true });
	};

	const handleSelectCase = (caseId) => {
		setSelectedCaseIds((prev) => {
			if (prev.includes(caseId)) {
				return prev.filter((id) => id !== caseId);
			} else {
				return [...prev, caseId];
			}
		});
	};

	const columnsConfig = useMemo(() => {
		return createColumnsConfig(casesData, {
			TextCell,
			FlaggingCell,
			SeverityCell,
			DateCell,
			StatusCell,
			UsersCell,
			CommentsCell,
			UserCell,
		});
	}, [casesData?.columns]);

	const tableData = useMemo(() => {
		return transformCasesDataToTableRows(casesData?.cases);
	}, [casesData?.cases]);

	// Mutation for updating case data
	const updateCaseMutation = useMutation({
		mutationFn: ({ caseId, columnKey, newValue }) =>
			updateReportCardCase({
				reportId,
				cardId,
				caseId,
				updates: {
					[columnKey]: newValue,
				},
				isSample: isSample,
			}),
		onSuccess: () => {
			// Invalidate and refetch cases data
			queryClient.invalidateQueries(['report-card-cases', reportId, cardId]);
			toast.success('Case updated successfully');
			setUpdatingCell(null);
		},
		onError: (error) => {
			console.error('Error updating case:', error);
			toast.error(
				error?.response?.data?.message ||
					'Failed to update case. Please try again.',
			);
			setUpdatingCell(null);
		},
	});
	const handleCellValueChange = (caseId, columnKey, newValue) => {
		setUpdatingCell({ caseId, columnKey });
		updateCaseMutation.mutate({ caseId, columnKey, newValue });
	};

	return (
		<TooltipProvider delayDuration={0}>
			<div className="border border-[#E5E7EB] rounded-lg overflow-hidden flex-1 flex flex-col min-w-0 relative">
				{/* Loading State Overlay */}
				{isLoadingCases && (
					<div className="absolute inset-0 bg-white z-30 flex items-center justify-center">
						<div className="flex items-center gap-2 text-[#6B7280]">
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6A12CE]"></div>
							<span>Loading cases...</span>
						</div>
					</div>
				)}

				{/* Empty State Overlay */}
				{!isLoadingCases && tableData.length === 0 && (
					<div className="absolute inset-0 bg-white z-30 flex items-center justify-center">
						<div className="text-[#6B7280]">No cases found</div>
					</div>
				)}

				{/* Table Content */}
				<div className="overflow-x-auto overflow-y-auto flex-1">
					<table className="w-full">
						<thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0 z-20">
							<tr>
								<th className="px-4 py-3 text-left w-12 bg-[#F9FAFB] sticky left-0 z-20"></th>
								{columnsConfig.map((column) => (
									<th
										key={column.key}
										className="px-4 py-3 bg-[#F9FAFB]"
										style={{
											position:
												column.key ===
												PRE_DEFINED_COLUMN_KEYS.CASE_ID
													? 'sticky'
													: 'relative',
											left:
												column.key ===
												PRE_DEFINED_COLUMN_KEYS.CASE_ID
													? '3rem'
													: 'auto',
											zIndex:
												column.key ===
												PRE_DEFINED_COLUMN_KEYS.CASE_ID
													? '10'
													: 'auto',
										}}
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<div
													className="py-1 text-left text-sm font-medium text-[#6B7280] bg-[#F9FAFB] line-clamp-2 cursor-default"
													style={{
														minWidth: column.width,
														maxWidth: column.width,
													}}
												>
													{column.label}
												</div>
											</TooltipTrigger>
											<TooltipContent className="bg-[#6D6D6D] text-white max-w-[11rem]">
												<p>{column.label}</p>
											</TooltipContent>
										</Tooltip>
									</th>
								))}
							</tr>
						</thead>

						<tbody className="bg-white">
							{tableData.map((caseData) => {
								const isSelected = selectedCaseIds.includes(
									caseData?.case_id,
								);

								return (
									<tr
										key={caseData.id}
										className="border-b border-[#E5E7EB] hover:bg-gray-50 group"
									>
										<td
											className={cn(
												'px-4 py-3 sticky left-0 z-10 bg-white ',
											)}
										>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() =>
													handleSelectCase(
														caseData?.case_id,
													)
												}
											/>
										</td>
										{columnsConfig.map((columnConfig) => {
											const Component =
												columnConfig?.Component;
											const isCellLoading =
												updatingCell?.caseId ===
													caseData.case_id &&
												updatingCell?.columnKey ===
													columnConfig.key;
											return (
												<td
													key={columnConfig.key}
													className={cn(
														'z-10 bg-white px-4 py-3',
													)}
													style={{
														position:
															columnConfig.key ===
															PRE_DEFINED_COLUMN_KEYS.CASE_ID
																? 'sticky'
																: 'relative',
														left:
															columnConfig.key ===
															PRE_DEFINED_COLUMN_KEYS.CASE_ID
																? '3rem'
																: 'auto',
														zIndex:
															columnConfig.key ===
															PRE_DEFINED_COLUMN_KEYS.CASE_ID
																? '10'
																: 'auto',
													}}
												>
													{Component && (
														<Component
															value={
																caseData[
																	columnConfig.key
																]
															}
															onChange={(newValue) =>
																handleCellValueChange(
																	caseData.case_id,
																	columnConfig.key,
																	newValue,
																)
															}
															isLoading={isCellLoading}
															caseData={caseData}
															onOpenTrail={
																handleOpenResolutionTrail
															}
														/>
													)}
												</td>
											);
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			{/* Resolution Trail Modal */}
			<ResolutionTrailModal
				open={resolutionTrailModalOpen}
				onClose={handleCloseResolutionTrail}
			/>
		</TooltipProvider>
	);
}
