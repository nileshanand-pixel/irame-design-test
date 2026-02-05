import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import generateSampleIcon from '@/assets/icons/generate-sample.svg';
import {
	ChevronDownIcon,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
	getReportCardCases,
	exportReportCardCases,
	getReportCardSamples,
	retrySampleGeneration,
} from '../../service/reports.service';
import { toast } from '@/lib/toast';
import BulkActions from './bulk-actions';
import CaseManagementTable from './case-management-table';
import GenerateSampleModal from './generate-sample-modal';
import Kpis, { KPI_KEYS } from '../kpis';
import { FiDownload, FiFlag } from 'react-icons/fi';
import { useReportPermission } from '@/contexts/ReportPermissionContext';
import { CASE_GENERATION_STATUS } from '../../constants';
import { queryClient } from '@/lib/react-query';

const PAGE_SIZE = 20;

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
	const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE);
	const [generateSampleModalOpen, setGenerateSampleModalOpen] = useState(false);
	const [exportPopoverOpen, setExportPopoverOpen] = useState(false);

	const [selectedSampleId, setSelectedSampleId] = useState(null);
	const [kpisData, setKpisData] = useState(null);

	const { isOwner } = useReportPermission();
	// API filters state
	const apiFilters = useMemo(() => {
		const filters = [];

		if (selectedKpi && KPI_KEY_AND_FILTER_MAP[selectedKpi]) {
			filters.push(KPI_KEY_AND_FILTER_MAP[selectedKpi]);
		}

		return filters;
	}, [selectedKpi]);

	// Fetch samples data
	const { data: samplesData } = useQuery({
		queryKey: ['report-card-samples', reportId, cardId],
		queryFn: () =>
			getReportCardSamples({
				reportId,
				cardId,
			}),
		enabled: open && Boolean(reportId) && Boolean(cardId),
		refetchInterval: (data) => {
			const samples = data?.state?.data?.samples || [];
			const isAnySampleGenerating = samples.some(
				(sample) => sample.status === CASE_GENERATION_STATUS.GENERATING,
			);
			if (isAnySampleGenerating) {
				return 5000; // Refetch every 5 seconds if any sample is generating
			}
			return false; // Stop refetching otherwise
		},
	});

	const selectedSampleData = useMemo(() => {
		return (
			samplesData?.samples?.find((sample) => sample.id === selectedSampleId) ||
			null
		);
	}, [samplesData, selectedSampleId]);

	// Fetch cases data from API
	const { data: casesData, isFetching: isFetchingCases } = useQuery({
		queryKey: [
			'report-card-cases',
			reportId,
			cardId,
			apiFilters,
			currentPage,
			rowsPerPage,
			selectedSampleId ?? 'all',
		],
		queryFn: () =>
			getReportCardCases({
				reportId,
				cardId,
				filters: apiFilters,
				pagination: {
					page: currentPage,
					page_size: rowsPerPage,
				},
				sampleId: selectedSampleId,
			}),
		enabled:
			open &&
			Boolean(reportId) &&
			Boolean(cardId) &&
			(!selectedSampleData ||
				selectedSampleData?.status === CASE_GENERATION_STATUS.GENERATED),
		staleTime: 0,
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
	}, [selectedSampleId]);

	// Export mutation
	const exportMutation = useMutation({
		mutationFn: ({ sample }) =>
			exportReportCardCases({
				reportId,
				cardId,
				sampleId: sample?.id,
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
	const handleExport = (sample) => {
		exportMutation.mutate({ sample });
	};

	// Retry sample generation mutation
	const retrySampleMutation = useMutation({
		mutationFn: ({ sampleId }) =>
			retrySampleGeneration({
				reportId,
				cardId,
				sampleId,
			}),
		onSuccess: () => {
			toast.success('Sample generation retry initiated successfully.');
			queryClient.invalidateQueries({
				queryKey: ['report-card-samples', reportId, cardId],
			});
		},
		onError: (error) => {
			console.error('Error retrying sample generation:', error);
			toast.error(
				error?.response?.data?.message ||
					'Failed to retry sample generation. Please try again.',
			);
		},
	});

	// Handle retry
	const handleRetrySample = () => {
		if (selectedSampleId) {
			retrySampleMutation.mutate({ sampleId: selectedSampleId });
		}
	};

	const isBulkActionsVisible = selectedCaseIds.length !== 0;
	const rowsPerPageOptions = useMemo(() => {
		const base = [10, 20, 30, 40, 50];
		if (!base.includes(rowsPerPage)) base.push(rowsPerPage);
		return base.sort((a, b) => a - b);
	}, [rowsPerPage]);

	const hasSampleData = samplesData && samplesData?.samples?.length > 0;

	const viewTabs = useMemo(() => {
		return [
			{
				label: 'All Data',
				value: null,
			},
			...(samplesData?.samples?.map((sample) => ({
				label: sample.name,
				value: sample.id,
			})) || []),
		];
	}, [samplesData]);

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
								{selectedSampleData &&
								selectedSampleData?.status ===
									CASE_GENERATION_STATUS.GENERATING ? (
									<div className="flex-1 flex items-center justify-center gap-2 text-[#6B7280]">
										<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6A12CE]"></div>
										<span>Generating Sample...</span>
									</div>
								) : selectedSampleId &&
								  selectedSampleData?.status ===
										CASE_GENERATION_STATUS.FAILED ? (
									<div className="flex-1 flex items-center justify-center">
										<div className="flex flex-col items-center gap-4 max-w-md text-center">
											{/* Error Icon */}
											<div className="relative">
												<div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
													<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
														<svg
															className="w-6 h-6 text-red-600"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
															xmlns="http://www.w3.org/2000/svg"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
													</div>
												</div>
											</div>

											{/* Error Message */}
											<div className="flex flex-col gap-2">
												<h3 className="text-lg font-semibold text-[#26064ACC]">
													Sample Generation Failed
												</h3>
												<p className="text-sm text-[#6B7280]">
													We encountered an error while
													generating the sample data.
													Please try again.
												</p>
											</div>

											{/* Retry Button */}
											<Button
												onClick={handleRetrySample}
												disabled={
													retrySampleMutation.isPending
												}
												className="min-w-[120px]"
											>
												{retrySampleMutation.isPending ? (
													<>
														<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
														Retrying...
													</>
												) : (
													<>
														<svg
															className="w-4 h-4 mr-2"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
															xmlns="http://www.w3.org/2000/svg"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
															/>
														</svg>
														Retry Generation
													</>
												)}
											</Button>
										</div>
									</div>
								) : (
									<CaseManagementTable
										isFetchingCases={isFetchingCases}
										casesData={casesData}
										selectedCaseIds={selectedCaseIds}
										setSelectedCaseIds={setSelectedCaseIds}
										reportId={reportId}
										cardId={cardId}
										isSample={selectedSampleId !== null}
									/>
								)}

								{/* Pagination and Actions */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3 min-w-0 flex-1">
										<div
											className={cn(
												'flex-shrink-0',
												!isOwner && 'cursor-not-allowed',
											)}
										>
											<Button
												variant="outline"
												className={cn(
													'text-[#26064ACC] border-[#E5E7EB] flex items-center gap-2',
													hasSampleData &&
														'rounded-full bg-[#26064A05] px-3 py-2',
												)}
												onClick={() =>
													isOwner &&
													setGenerateSampleModalOpen(true)
												}
												disabled={!isOwner}
											>
												<img
													src={generateSampleIcon}
													alt="generate sample"
													className="w-4 h-4"
												/>
												{!hasSampleData && 'Generate Sample'}
											</Button>
										</div>

										{/* Data View Tabs - Only show if sample data exists */}
										{hasSampleData && (
											<div className="min-w-0 flex-1 overflow-hidden">
												<Tabs
													value={selectedSampleId}
													onValueChange={
														setSelectedSampleId
													}
													className="max-w-2xl"
												>
													<TabsList className="h-9 bg-transparent p-1 overflow-x-auto flex-nowrap w-full justify-start [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
														{viewTabs.map((tab) => (
															<TabsTrigger
																key={tab.value}
																value={tab.value}
																className="text-sm px-4 data-[state=active]:bg-[#6A12CD0A] data-[state=active]:text-[#26064ACC] data-[state=active]:shadow-sm whitespace-nowrap flex-shrink-0"
															>
																{tab.label.length >
																15
																	? `${tab.label.slice(0, 15)}...`
																	: tab.label}
															</TabsTrigger>
														))}
													</TabsList>
												</Tabs>
											</div>
										)}
									</div>

									<div className="flex items-center gap-4 flex-shrink-0 ml-10">
										<div className="flex items-center space-x-2 text-sm font-normal text-primary80">
											<p className="whitespace-nowrap">
												Rows per page :
											</p>
											<Select
												value={`${rowsPerPage}`}
												onValueChange={(value) => {
													setCurrentPage(1);
													setSelectedCaseIds([]);
													setRowsPerPage(Number(value));
												}}
											>
												<SelectTrigger className="h-9 w-16 text-xs font-normal text-primary100 [&>svg]:text-primary100 [&>svg]:opacity-100 px-2">
													<SelectValue
														placeholder={rowsPerPage}
													/>
												</SelectTrigger>
												<SelectContent
													side="top"
													className="text-xs font-normal textprimary80 py-2"
												>
													{rowsPerPageOptions.map(
														(size) => (
															<SelectItem
																key={size}
																value={`${size}`}
																className="text-xs font-normal textprimary80 hover:bg-purple-2 cursor-pointer data-[state=checked]:bg-purple-4 data-[state=checked]:font-medium"
															>
																<span>{size}</span>
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
										</div>
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
															handleExport()
														}
														className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
														disabled={
															exportMutation.isPending
														}
													>
														All Data
													</button>
													{samplesData?.samples?.length !==
														0 &&
														samplesData?.samples?.map(
															(sample) => (
																<button
																	onClick={() =>
																		handleExport(
																			sample,
																		)
																	}
																	disabled={
																		sample.status !==
																			CASE_GENERATION_STATUS.GENERATED ||
																		!hasSampleData ||
																		exportMutation.isPending
																	}
																	className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
																>
																	{sample.name}
																</button>
															),
														)}
												</div>
											</PopoverContent>
										</Popover>

										{(!selectedSampleData ||
											selectedSampleData?.status ===
												CASE_GENERATION_STATUS.GENERATED) && (
											<div className="flex items-center gap-2">
												<span className="text-sm text-[#6B7280]">
													Page {currentPage} of{' '}
													{totalPages}
												</span>
												<div className="flex items-center gap-1">
													<button
														onClick={() =>
															setCurrentPage(1)
														}
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
															isFetchingCases
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
															currentPage ===
																totalPages ||
															isFetchingCases
														}
														className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
													>
														<ChevronRight className="w-4 h-4" />
													</button>
													<button
														onClick={() =>
															setCurrentPage(
																totalPages,
															)
														}
														disabled={
															currentPage ===
															totalPages
														}
														className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
													>
														<ChevronsRight className="w-4 h-4" />
													</button>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Second Column */}
							<BulkActions
								isBulkActionsVisible={isBulkActionsVisible}
								selectedCaseIds={selectedCaseIds}
								onCancel={() => setSelectedCaseIds([])}
								reportId={reportId}
								cardId={cardId}
								isSample={selectedCaseIds !== null}
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
				samplesData={samplesData}
				setSelectedSampleId={setSelectedSampleId}
			/>
		</>
	);
};

export default FlagExceptionsModal;
