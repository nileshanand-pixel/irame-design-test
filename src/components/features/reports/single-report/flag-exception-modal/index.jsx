import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import generateSampleIcon from '@/assets/icons/generate-sample.svg';
import {
	ChevronDown,
	ChevronDownIcon,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
	getReportCardCases,
	exportReportCardCases,
} from '../../service/reports.service';
import { toast } from '@/lib/toast';
import BulkActions from './bulk-actions';
import CaseManagementTable from './case-management-table';
import GenerateSampleModal from './generate-sample-modal';
import Kpis, { KPI_KEYS } from '../kpis';
import { FiDownload, FiFlag } from 'react-icons/fi';

const PAGE_SIZE = 15;

const DATA_VIEW_TABS = {
	ALL: 'all',
	SAMPLE: 'sample',
};
const DATA_VIEW_TABS_CONFIG = {
	[DATA_VIEW_TABS.ALL]: {
		label: 'All Data',
		value: DATA_VIEW_TABS.ALL,
	},
	[DATA_VIEW_TABS.SAMPLE]: {
		label: 'Sample Data',
		value: DATA_VIEW_TABS.SAMPLE,
	},
};

const KPI_KEY_AND_FILTER_MAP = {
	[KPI_KEYS.TOTAL_EXCEPTIONS_FLAGGED_BY_IRA]: null,
	[KPI_KEYS.FINAL_EXCEPTIONS_FLAGGED]: {
		column_name: 'flagging',
		search_key: 'red',
		filter_case: 6,
	},
	[KPI_KEYS.EXCEPTIONS_RESOLVED]: {
		column_name: 'flagging',
		search_key: 'green',
		filter_case: 6,
	},
	[KPI_KEYS.REVIEW_PENDING]: {
		column_name: 'flagging',
		filter_case: 0,
	},
};

const FlagExceptionsModal = ({ open, onClose, reportId, cardId }) => {
	const [totalPages, setTotalPages] = useState(1);
	const [selectedKpi, setSelectedKpi] = useState(
		KPI_KEYS.TOTAL_EXCEPTIONS_FLAGGED_BY_IRA,
	);
	const [selectedCaseIds, setSelectedCaseIds] = useState([]);

	const [currentPage, setCurrentPage] = useState(1);
	const [generateSampleModalOpen, setGenerateSampleModalOpen] = useState(false);
	const [exportPopoverOpen, setExportPopoverOpen] = useState(false);

	// Data view tab state - 'all' or 'sample'
	const [dataViewTab, setDataViewTab] = useState(DATA_VIEW_TABS.ALL);
	const [hasSampleData, setHasSampleData] = useState(false);
	const [kpisData, setKpisData] = useState(null);

	// API filters state
	const apiFilters = useMemo(() => {
		const filters = [];

		if (selectedKpi && KPI_KEY_AND_FILTER_MAP[selectedKpi]) {
			filters.push(KPI_KEY_AND_FILTER_MAP[selectedKpi]);
		}

		return filters;
	}, [selectedKpi]);

	// Check if sample data exists
	const { data: sampleCheckData } = useQuery({
		queryKey: ['report-card-sample-check', reportId, cardId],
		queryFn: () =>
			getReportCardCases({
				reportId,
				cardId,
				filters: [],
				pagination: {
					page: 1,
					page_size: 1,
				},
				isSample: true,
			}),
		enabled: open && Boolean(reportId) && Boolean(cardId),
	});

	// Update hasSampleData when sample check data changes
	useEffect(() => {
		if (sampleCheckData) {
			const hasSample =
				sampleCheckData?.cases?.length > 0 ||
				sampleCheckData?.pagination?.total > 0;
			setHasSampleData(hasSample);
		}
	}, [sampleCheckData]);

	// Fetch cases data from API
	const { data: casesData, isLoading: isLoadingCases } = useQuery({
		queryKey: [
			'report-card-cases',
			reportId,
			cardId,
			apiFilters,
			currentPage,
			PAGE_SIZE,
			dataViewTab,
		],
		queryFn: () =>
			getReportCardCases({
				reportId,
				cardId,
				filters: apiFilters,
				pagination: {
					page: currentPage,
					page_size: PAGE_SIZE,
				},
				isSample: dataViewTab === DATA_VIEW_TABS.SAMPLE,
			}),
		enabled: open && Boolean(reportId) && Boolean(cardId),
	});

	useEffect(() => {
		if (casesData) {
			setKpisData(casesData?.kpis);
			setTotalPages(casesData?.pagination?.pages);
		}
	}, [casesData]);

	// Reset pagination when metric changes
	useEffect(() => {
		setCurrentPage(1);
		setSelectedCaseIds([]);
	}, [selectedKpi]);

	// Reset pagination and filters when data view tab changes
	useEffect(() => {
		setCurrentPage(1);
		setSelectedKpi(KPI_KEYS.TOTAL_EXCEPTIONS_FLAGGED_BY_IRA);
		setSelectedCaseIds([]);
	}, [dataViewTab]);

	// Export mutation
	const exportMutation = useMutation({
		mutationFn: ({ isSample }) =>
			exportReportCardCases({
				reportId,
				cardId,
				isSample,
			}),
		onSuccess: (data, variables) => {
			setExportPopoverOpen(false);
			toast.success(
				data?.message ||
					`Export started for ${variables.isSample ? 'sample' : 'all'} data. You will notify you once the CSV file is ready.`,
			);
		},
		onError: (error) => {
			console.error('Error exporting CSV:', error);
			setExportPopoverOpen(false);
			toast.error(
				error?.response?.data?.message ||
					'Failed to start export. Please try again.',
			);
		},
		onSettled: () => {
			// Ensure popover closes after mutation completes (success or error)
			setExportPopoverOpen(false);
		},
	});

	// Handle export
	const handleExport = (isSample) => {
		exportMutation.mutate({ isSample });
	};

	const isBulkActionsVisible = selectedCaseIds.length !== 0;

	return (
		<>
			<Dialog open={open} onOpenChange={onClose}>
				<DialogContent
					className={cn(
						'max-w-[calc(100vw-2rem)] w-full h-[calc(100vh-2rem)]',
						'p-6 gap-4',
						'flex flex-col',
					)}
				>
					<div className="flex items-center gap-4 pb-4 border-b border-[#0000001A]">
						<div className="items-center justify-center p-3 inline-flex bg-[#F9F6FD] rounded-full">
							<div className="inline-flex items-center justify-center p-3 bg-[#6A12CE14] rounded-full">
								<FiFlag className="size-4 text-[#26064A99]" />
							</div>
						</div>

						<div>
							<div className="text-[#26064ACC] font-semibold">
								Flag as Exceptions
							</div>
							<div className="text-[#26064A99] text-xs">
								Review and manage exceptions for this query. Update
								status and add comments to track progress.
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-6">
						<Kpis
							kpisData={kpisData}
							onSelect={setSelectedKpi}
							selectedKpi={selectedKpi}
						/>

						{/* 2 Column Layout */}
						<div className={'flex gap-4 h-[calc(100vh-17rem)] min-w-0'}>
							{/* First Column */}
							<div
								className={cn(
									'flex flex-col gap-4 transition-all min-w-0',
									isBulkActionsVisible ? 'flex-[3]' : 'flex-1',
								)}
							>
								<CaseManagementTable
									isLoadingCases={isLoadingCases}
									casesData={casesData}
									selectedCaseIds={selectedCaseIds}
									setSelectedCaseIds={setSelectedCaseIds}
									reportId={reportId}
									cardId={cardId}
									isSample={dataViewTab === DATA_VIEW_TABS.SAMPLE}
								/>

								{/* Pagination and Actions */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Button
											variant="outline"
											className={cn(
												'text-[#26064ACC] border-[#E5E7EB] flex items-center gap-2',
												hasSampleData &&
													'rounded-full bg-[#26064A05] px-3 py-2',
											)}
											onClick={() =>
												setGenerateSampleModalOpen(true)
											}
										>
											<img
												src={generateSampleIcon}
												alt="generate sample"
												className="w-4 h-4"
											/>
											{!hasSampleData && 'Generate Sample'}
										</Button>

										{/* Data View Tabs - Only show if sample data exists */}
										{hasSampleData && (
											<Tabs
												value={dataViewTab}
												onValueChange={setDataViewTab}
												className="w-auto"
											>
												<TabsList className="h-9 bg-transparent p-1">
													{Object.values(
														DATA_VIEW_TABS,
													).map((tab) => (
														<TabsTrigger
															key={
																DATA_VIEW_TABS_CONFIG[
																	tab
																].value
															}
															value={
																DATA_VIEW_TABS_CONFIG[
																	tab
																].value
															}
															className="text-sm px-4 data-[state=active]:bg-[#6A12CD0A] data-[state=active]:text-[#26064ACC] data-[state=active]:shadow-sm"
														>
															{
																DATA_VIEW_TABS_CONFIG[
																	tab
																].label
															}
														</TabsTrigger>
													))}
												</TabsList>
											</Tabs>
										)}
									</div>

									<div className="flex items-center gap-4">
										<Popover
											open={exportPopoverOpen}
											onOpenChange={setExportPopoverOpen}
										>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													className="flex items-center gap-2"
													disabled={
														exportMutation.isPending
													}
												>
													<FiDownload className="size-4 text-[#26064A99]" />
													<span className="text-[#26064ACC] text-xs">
														{exportMutation.status ===
														'pending'
															? 'Exporting...'
															: 'Export CSV'}
													</span>
													<div className="w-[0.0625rem] h-[1.125rem] bg-[#26064A66]"></div>
													<ChevronDownIcon className="size-4" />
												</Button>
											</PopoverTrigger>

											<PopoverContent
												className="w-48 p-2"
												align="end"
											>
												<div className="flex flex-col gap-1">
													<button
														onClick={() =>
															handleExport(false)
														}
														className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
														disabled={
															exportMutation.isPending
														}
													>
														All Data
													</button>
													<button
														onClick={() =>
															handleExport(true)
														}
														disabled={
															!hasSampleData ||
															exportMutation.isPending
														}
														className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
													>
														Sample Data
													</button>
												</div>
											</PopoverContent>
										</Popover>

										<div className="flex items-center gap-2">
											<span className="text-sm text-[#6B7280]">
												Page {currentPage} of {totalPages}
											</span>
											<div className="flex items-center gap-1">
												<button
													onClick={() => setCurrentPage(1)}
													disabled={currentPage === 1}
													className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
												>
													<ChevronsLeft className="w-4 h-4" />
												</button>
												<button
													onClick={() =>
														setCurrentPage(
															(prev) => prev - 1,
														)
													}
													disabled={
														currentPage === 1 ||
														isLoadingCases
													}
													className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
												>
													<ChevronLeft className="w-4 h-4" />
												</button>
												<button
													onClick={() =>
														setCurrentPage(
															(prev) => prev + 1,
														)
													}
													disabled={
														currentPage === totalPages ||
														isLoadingCases
													}
													className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
												>
													<ChevronRight className="w-4 h-4" />
												</button>
												<button
													onClick={() =>
														setCurrentPage(totalPages)
													}
													disabled={
														currentPage === totalPages
													}
													className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
												>
													<ChevronsRight className="w-4 h-4" />
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Second Column */}
							<BulkActions
								isBulkActionsVisible={isBulkActionsVisible}
								selectedCaseIds={selectedCaseIds}
								reportId={reportId}
								cardId={cardId}
								isSample={dataViewTab === DATA_VIEW_TABS.SAMPLE}
							/>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Generate Sample Modal */}
			<GenerateSampleModal
				open={generateSampleModalOpen}
				onClose={() => setGenerateSampleModalOpen(false)}
				reportId={reportId}
				cardId={cardId}
				showSampleData={() => setDataViewTab(DATA_VIEW_TABS.SAMPLE)}
			/>
		</>
	);
};

export default FlagExceptionsModal;
