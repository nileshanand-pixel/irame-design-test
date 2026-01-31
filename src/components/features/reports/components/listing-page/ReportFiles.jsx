import React, { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUnifiedReports, deleteReport } from '../../service/reports.service';
import { useDispatch } from 'react-redux';
import { updateReportStoreProp } from '@/redux/reducer/reportReducer';
import { openModal } from '@/redux/reducer/modalReducer';
import { DownloadModal } from '../common/download-modal';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
import useAuth from '@/hooks/useAuth';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import { toast } from '@/lib/toast';
import CircularLoader from '@/components/elements/loading/CircularLoader';

const ReportFiles = ({
	view,
	activeTab,
	search,
	sortValue,
	ownerFilter,
	// onDisplayReportsChange,
}) => {
	const { userDetails } = useAuth();
	const [selectedFile, setSelectedFile] = useState(null);
	const [showDownloadModal, setShowDownloadModal] = useState(false);
	const [ConfirmationDialog, confirm] = useConfirmDialog();
	const queryClient = useQueryClient();
	const dispatch = useDispatch();

	const space = activeTab.space;

	// Create a stable query function that uses the latest filters
	// team_id is NOT passed here - it comes from X-TEAM-ID header set by axios
	const unifiedReportsQueryFn = useCallback(
		(params) => {
			const queryParams = {
				space,
				search: search || '',
				sort_by: sortValue?.field || 'created_at',
				sort_order: sortValue?.order || 'desc',
				owner_ids: ownerFilter,
				limit: 20,
				...params,
			};

			return getUnifiedReports(queryParams);
		},
		[space, search, sortValue, ownerFilter],
	);

	// Infinite scroll pagination with React Query
	const {
		data: displayReports,
		isLoading,
		isError,
		error,
		isFetchingNextPage,
		hasNextPage,
		Sentinel,
	} = useInfiniteScroll({
		queryKey: ['unified-reports', space, search || '', sortValue, ownerFilter],
		queryFn: unifiedReportsQueryFn,
		paginationType: 'cursor',
		options: {
			limit: 20,
		},
	});

	// Update parent component with the count of displayed reports
	// React.useEffect(() => {
	// 	if (onDisplayReportsChange) {
	// 		onDisplayReportsChange(displayReports?.length || 0);
	// 	}
	// }, [displayReports, onDisplayReportsChange]);

	const deleteReportMutation = useMutation({
		mutationFn: ({ reportId }) => deleteReport({ reportId }),
		onSuccess: () => {
			queryClient.invalidateQueries(['unified-reports']);
			toast.success('Report deleted successfully');
		},
		onError: (err) => {
			toast.error(
				err?.response?.data?.message ||
					'Failed to delete report. Please try again.',
			);
		},
	});

	const handleDownload = (file) => {
		setSelectedFile(file);
		setShowDownloadModal(true);
	};

	const handleDelete = async (file) => {
		setSelectedFile(file);

		const confirmed = await confirm({
			header: 'Delete File?',
			description: 'Are you sure you want to delete this file?',
			secondaryCtaText: 'Cancel',
			primaryCtaText: 'Delete',
			primaryCtaVariant: 'destructive',
		});

		if (!confirmed) return;

		try {
			const reportId = file?.report_id || file?.id;
			if (!reportId) {
				return;
			}

			await deleteReportMutation.mutateAsync({ reportId });
		} catch (err) {
			console.error('Failed to delete report', err);
		}
	};

	const handleShare = (file) => {
		dispatch(updateReportStoreProp([{ key: 'selectedReport', value: file }]));
		dispatch(openModal({ modalName: 'shareReport' }));
	};

	if (isLoading) {
		return (
			<div className="p-6 text-center text-primary60 w-full h-full flex items-center justify-center gap-2">
				<CircularLoader size="sm" />
				Loading reports
			</div>
		);
	}

	if (!displayReports || displayReports.length === 0 || isError) {
		return (
			<div className="p-6 text-center w-full h-full flex items-center justify-center gap-2">
				<p className="text-primary60 font-medium">No reports found</p>
			</div>
		);
	}

	const Component = view.component;

	return (
		<div className="w-full">
			{Component && (
				<Component
					displayReports={displayReports}
					handleDownload={handleDownload}
					handleDelete={handleDelete}
					handleShare={handleShare}
					space={space}
				/>
			)}

			{hasNextPage && displayReports.length > 0 && (
				<div className="py-6 flex justify-center">
					{isFetchingNextPage && (
						<div className="flex items-center gap-2">
							<CircularLoader size="sm" />
							<span className="text-sm text-primary60">
								Loading more reports...
							</span>
						</div>
					)}
					<Sentinel />
				</div>
			)}

			<ConfirmationDialog />
			<DownloadModal
				open={showDownloadModal}
				onClose={() => setShowDownloadModal(false)}
				reportId={selectedFile?.report_id}
				reportName={selectedFile?.name}
			/>
		</div>
	);
};

export default ReportFiles;
