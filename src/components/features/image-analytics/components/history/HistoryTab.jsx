import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import {
	getImageAnalyticsJobs,
	deleteImageAnalyticsJob,
} from '../../service/imageAnalytics.service';
import { createHistoryColumns } from './HistoryColumns';
import Spinner from '@/components/elements/loading/Spinner';

const HistoryTab = ({ onViewJob }) => {
	const queryClient = useQueryClient();

	const { data: jobs, isLoading } = useQuery({
		queryKey: ['ia-jobs-history'],
		queryFn: getImageAnalyticsJobs,
	});

	const handleDelete = useCallback(
		async (jobId) => {
			const confirmed = window.confirm(
				'This will permanently delete this job. Continue?',
			);
			if (!confirmed) return;

			try {
				await deleteImageAnalyticsJob(jobId);
				toast.success('Job deleted successfully');
				queryClient.invalidateQueries({
					queryKey: ['ia-jobs-history'],
				});
			} catch {
				toast.error('Failed to delete job');
			}
		},
		[queryClient],
	);

	const columns = useMemo(
		() => createHistoryColumns(onViewJob, handleDelete),
		[onViewJob, handleDelete],
	);

	const table = useReactTable({
		data: jobs || [],
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spinner />
			</div>
		);
	}

	if (!jobs?.length) {
		return (
			<div className="text-center py-12">
				<p className="text-primary40 text-sm">
					No Image Analytics jobs yet. Try Image Chat, Compare, or Audit
					Report.
				</p>
			</div>
		);
	}

	return (
		<div className="border rounded-lg overflow-hidden">
			<table className="w-full">
				<thead className="bg-purple-4">
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									className="text-left px-4 py-3 text-xs font-medium text-primary60"
								>
									{flexRender(
										header.column.columnDef.header,
										header.getContext(),
									)}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<tr
							key={row.id}
							className="border-t border-gray-100 hover:bg-purple-2 cursor-pointer transition-colors"
							onClick={() => {
								if (row.original.status === 'COMPLETED') {
									onViewJob(
										row.original.externalId,
										row.original.jobType,
									);
								}
							}}
						>
							{row.getVisibleCells().map((cell) => (
								<td
									key={cell.id}
									className="px-4 py-3 text-sm text-primary80"
								>
									{flexRender(
										cell.column.columnDef.cell,
										cell.getContext(),
									)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default HistoryTab;
