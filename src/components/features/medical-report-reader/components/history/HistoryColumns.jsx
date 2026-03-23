import dayjs from 'dayjs';
import { MR_STATUSES } from '../../constants/medical-reader.constants';

export const getMedicalReaderHistoryColumns = ({ onView, onDelete }) => [
	{
		accessorKey: 'fileNames',
		header: 'Files',
		cell: ({ row }) => {
			const names = row.original.fileNames || [];
			return (
				<div className="max-w-[200px]">
					<p className="text-sm text-primary80 truncate font-medium">
						{names[0] || 'No files'}
					</p>
					{names.length > 1 && (
						<p className="text-xs text-primary40">
							+{names.length - 1} more
						</p>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Date',
		cell: ({ row }) => (
			<span className="text-sm text-primary60">
				{row.original.createdAt
					? dayjs(row.original.createdAt).format('DD MMM YYYY, HH:mm')
					: '—'}
			</span>
		),
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => {
			const status = MR_STATUSES[row.original.status] || MR_STATUSES.PENDING;
			return (
				<span
					className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}
				>
					{status.label}
				</span>
			);
		},
	},
	{
		id: 'actions',
		header: '',
		cell: ({ row }) => {
			const { status, externalId } = row.original;
			const canView = status !== 'CANCELLED';
			return (
				<div className="flex items-center gap-2 justify-end">
					{canView && (
						<button
							onClick={() => onView(externalId)}
							className="text-xs text-purple-100 hover:text-purple-80 font-medium transition-colors"
						>
							{status === 'COMPLETED'
								? 'View'
								: status === 'IN_PROGRESS' || status === 'PENDING'
									? 'Track'
									: 'View'}
						</button>
					)}
					<button
						onClick={() => onDelete(externalId)}
						className="text-xs text-primary40 hover:text-red-500 font-medium transition-colors"
					>
						Delete
					</button>
				</div>
			);
		},
	},
];
