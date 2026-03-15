import dayjs from 'dayjs';
import { IA_STATUSES, IA_JOB_TYPES } from '../../constants/imageAnalytics.constants';

export const createHistoryColumns = (onView, onDelete) => [
	{
		accessorKey: 'file_names',
		header: 'Files',
		cell: ({ getValue }) => {
			const names = getValue();
			if (!names?.length) return '-';
			return (
				<div className="text-sm font-medium text-primary80">
					{names.length === 1 ? (
						names[0]
					) : (
						<span>
							{names[0]}{' '}
							<span className="text-primary40 font-normal">
								+{names.length - 1} more
							</span>
						</span>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: 'job_type',
		header: 'Type',
		cell: ({ getValue }) => {
			const type = IA_JOB_TYPES[getValue()] || IA_JOB_TYPES.CHAT;
			return (
				<span
					className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${type.color} ${type.bgColor}`}
				>
					{type.label}
				</span>
			);
		},
	},
	{
		accessorKey: 'created_at',
		header: 'Date',
		cell: ({ getValue }) => {
			const val = getValue();
			return (
				<span className="text-sm text-primary60">
					{val ? dayjs(val).format('MMM D, YYYY h:mm A') : '-'}
				</span>
			);
		},
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ getValue }) => {
			const status = IA_STATUSES[getValue()] || IA_STATUSES.PENDING;
			return (
				<span
					className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${status.color} ${status.bgColor}`}
				>
					{status.label}
				</span>
			);
		},
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => (
			<div className="flex items-center gap-2">
				{row.original.status === 'COMPLETED' && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onView(row.original.external_id, row.original.job_type);
						}}
						className="text-xs text-purple-100 hover:text-purple-80 font-medium"
					>
						View
					</button>
				)}
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete(row.original.external_id);
					}}
					className="text-xs text-red-500 hover:text-red-700 font-medium"
				>
					Delete
				</button>
			</div>
		),
	},
];
