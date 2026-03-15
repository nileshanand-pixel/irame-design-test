import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from '@/components/ui/select';
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
import {
	SELECTION_SCOPE_OPTIONS,
	SELECT_ALL_STATES,
	addIndexRangeToArraySelection,
	toggleIdInArraySelection,
} from './row-selection-helpers';
import { useShiftKeyPressedRef } from './use-shift-key-pressed';
import { useReportPermission } from '@/contexts/ReportPermissionContext';
import {
	SELECTION_SCOPE_OPTIONS,
	SELECT_ALL_STATES,
	addIndexRangeToArraySelection,
	toggleIdInArraySelection,
} from './row-selection-helpers';
import { useShiftKeyPressedRef } from './use-shift-key-pressed';

export default function CaseManagementTable({
	isFetchingCases,
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
	const { isOwner } = useReportPermission();
	// Tracks Shift globally
	const shiftKeyPressedRef = useShiftKeyPressedRef();
	// Last selected row index for Shift+Click range selection (last interacted row on the current page).
	const lastSelectedIndexRef = useRef(null);

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

	const selectedCaseIdSet = useMemo(() => {
		return new Set(selectedCaseIds);
	}, [selectedCaseIds]);

	// Memoize current page case IDs to avoid recalculating on every render
	const currentPageCaseIds = useMemo(() => {
		return tableData.map((caseData) => caseData.case_id);
	}, [tableData]);

	const handleSelectCase = useCallback(
		(caseId, currentRowIndex) => {
			if (!isOwner) return;

			const isShiftPressed = shiftKeyPressedRef.current;
			const lastSelectedRowIndex = lastSelectedIndexRef.current;
			const isAlreadySelected = selectedCaseIdSet.has(caseId);

			setSelectedCaseIds((prev) => {
				// Shift+Click selects the full range from last selected row to current row. Existing selections outside the range are preserved.
				if (isShiftPressed && lastSelectedRowIndex !== null) {
					return addIndexRangeToArraySelection(
						prev,
						currentPageCaseIds,
						lastSelectedRowIndex,
						currentRowIndex,
					);
				}

				// Normal click toggles the clicked row only.
				return toggleIdInArraySelection(prev, caseId);
			});

			//Clear anchor on normal deselection, otherwise set/update it.
			lastSelectedIndexRef.current =
				isAlreadySelected && !isShiftPressed ? null : currentRowIndex;
		},
		[currentPageCaseIds, isOwner, setSelectedCaseIds, selectedCaseIdSet],
	);

	// Reset last selected row index when the visible rows change (pagination/filter/sort).
	useEffect(() => {
		lastSelectedIndexRef.current = null;
	}, [currentPageCaseIds]);

	// Reset last selected row index when selection is cleared via bulk deselect.
	useEffect(() => {
		if (selectedCaseIds.length === 0) lastSelectedIndexRef.current = null;
	}, [selectedCaseIds.length]);

	const currentPageCaseIdSet = useMemo(() => {
		return new Set(currentPageCaseIds);
	}, [currentPageCaseIds]);

	// Memoize selection state calculations for current page
	const selectAllState = useMemo(() => {
		if (currentPageCaseIds.length === 0) return SELECT_ALL_STATES.NONE;
		let selectedCount = 0;
		for (const caseId of currentPageCaseIds) {
			if (selectedCaseIdSet.has(caseId)) selectedCount += 1;
		}

		if (selectedCount === 0) return SELECT_ALL_STATES.NONE;
		if (selectedCount === currentPageCaseIds.length)
			return SELECT_ALL_STATES.ALL;
		return SELECT_ALL_STATES.INDETERMINATE;
	}, [currentPageCaseIds, selectedCaseIdSet]);

	const selectCurrentPageCases = useCallback(() => {
		setSelectedCaseIds((prev) => {
			if (currentPageCaseIds.length === 0) return prev;
			const next = new Set(prev);
			const beforeSize = next.size;
			for (const caseId of currentPageCaseIds) next.add(caseId);
			if (next.size === beforeSize) return prev;
			return Array.from(next);
		});
	}, [currentPageCaseIds, setSelectedCaseIds]);

	const deselectCurrentPageCases = useCallback(() => {
		setSelectedCaseIds((prev) => {
			if (currentPageCaseIds.length === 0 || prev.length === 0) return prev;
			const next = prev.filter((id) => !currentPageCaseIdSet.has(id));
			if (next.length === prev.length) return prev;
			return next;
		});
	}, [currentPageCaseIdSet, currentPageCaseIds.length, setSelectedCaseIds]);

	const handleSelectionItem = useCallback(
		(scopeValue) => {
			if (selectAllState === SELECT_ALL_STATES.ALL) {
				deselectCurrentPageCases();
			} else {
				selectCurrentPageCases();
			}
		},
		[selectCurrentPageCases, deselectCurrentPageCases, selectAllState],
	);

	// Handle select all for current page only
	const handleSelectAll = useCallback(
		(checked) => {
			lastSelectedIndexRef.current = null;

			if (
				checked === SELECT_ALL_STATES.ALL ||
				checked === SELECT_ALL_STATES.INDETERMINATE
			) {
				selectCurrentPageCases();
			} else {
				deselectCurrentPageCases();
			}
		},
		[deselectCurrentPageCases, selectCurrentPageCases],
	);

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
			queryClient.invalidateQueries({
				queryKey: ['report-card-cases', reportId, cardId],
			});
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
	const handleCellValueChange = useCallback(
		(caseId, columnKey, newValue) => {
			setUpdatingCell({ caseId, columnKey });
			updateCaseMutation.mutate({ caseId, columnKey, newValue });
		},
		[updateCaseMutation],
	);

	return (
		<TooltipProvider delayDuration={0}>
			<div className="border border-[#E5E7EB] rounded-lg overflow-hidden flex-1 flex flex-col min-w-0 relative">
				{/* Loading State Overlay */}
				{isFetchingCases && (
					<div className="absolute inset-0 bg-white z-30 flex items-center justify-center">
						<div className="flex items-center gap-2 text-[#6B7280]">
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6A12CE]"></div>
							<span>Loading cases...</span>
						</div>
					</div>
				)}

				{/* Empty State Overlay */}
				{!isFetchingCases && tableData.length === 0 && (
					<div className="absolute inset-0 bg-white z-30 flex items-center justify-center">
						<div className="text-[#6B7280]">No cases found</div>
					</div>
				)}

				{/* Table Content */}
				<div className="overflow-x-auto overflow-y-auto flex-1">
					<table className="w-full">
						<thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0 z-20">
							<tr>
								<th className="px-4 py-3 text-left w-12 bg-[#F9FAFB] sticky left-0 z-20">
									<div className="flex items-center">
										<Tooltip>
											<TooltipTrigger asChild>
												<div>
													<Checkbox
														checked={selectAllState}
														onCheckedChange={
															handleSelectAll
														}
														aria-label="Select all on this page"
														className="focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0 outline-none data-[state=unchecked]:border-primary80 border-2"
													/>
												</div>
											</TooltipTrigger>
											<TooltipContent className="bg-[#6D6D6D] text-white">
												<p>
													{selectAllState ===
													SELECT_ALL_STATES.ALL
														? 'Deselect all'
														: selectAllState ===
															  SELECT_ALL_STATES.INDETERMINATE
															? 'Select remaining'
															: 'Select all'}
												</p>
											</TooltipContent>
										</Tooltip>

										<Select>
											<SelectTrigger className="h-6 w-fit bg-transparent border-none px-2 py-0 [&>svg]:text-primary80 [&>svg]:opacity-100 [&>svg]:[stroke-width:2.5]" />
											<SelectContent
												className="py-2"
												align="start"
												side="bottom"
												alignOffset={-15}
											>
												{SELECTION_SCOPE_OPTIONS.map(
													(opt) => (
														<SelectItem
															key={opt.value}
															value={opt.value}
															onPointerDown={(event) =>
																handleSelectionItem(
																	opt.value,
																	event,
																)
															}
															onKeyDown={(event) =>
																handleSelectionItem(
																	opt.value,
																	event,
																)
															}
															className="text-sm text-primary100 hover:bg-purple-4 cursor-pointer"
														>
															{opt.label}
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
									</div>
								</th>
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
													? '4rem'
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
							{tableData.map((caseData, rowIndex) => {
								const isSelected = selectedCaseIdSet.has(
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
														rowIndex,
													)
												}
												className="focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0 outline-none data-[state=unchecked]:border-primary80 border-2"
												disabled={!isOwner}
												className="focus-visible:ring-0 focus-visible:ring-offset-0 ring-0 ring-offset-0 outline-none data-[state=unchecked]:border-primary80 border-2"
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
																? '4rem'
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
