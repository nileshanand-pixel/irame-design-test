import { useState, useMemo } from 'react';
import { DataTable } from '@/components/elements/DataTable';
import logsEmpty from '@/assets/icons/empty-logs.svg';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '../empty-state';

const EMPTY_STATE_CONFIG = {
	image: logsEmpty,
	heading: 'No Activity Logged Yet',
	descriptionLines: [
		'This section will show a chronological record of all user',
		'actions, system events, and data changes once they occur.',
	],
	cta: null,
	ctaText: null,
};

export default function LogsTabContent() {
	const [logs, setLogs] = useState([
		{
			id: 1,
			date: '20-10-2025',
			time: '08:33 PM',
			action: 'Assign Role',
			actionBy: 'Tushar Goel',
			role: 'Manager',
			description: 'Added workflows.approve permission',
		},
		{
			id: 2,
			date: '20-10-2025',
			time: '08:33 PM',
			action: 'Assign Role',
			actionBy: 'Tushar Goel',
			role: 'Manager',
			description: 'Added workflows.approve permission',
		},
		{
			id: 3,
			date: '21-10-2025',
			time: '09:00 PM',
			action: 'Update Permissions',
			actionBy: 'Liam Johnson',
			role: 'Designer',
			description: 'Updated UI for better accessibility',
		},
		{
			id: 4,
			date: '22-10-2025',
			time: '09:15 PM',
			action: 'Assign Role',
			actionBy: 'Rajiv Singh',
			role: 'Product Owner',
			description: 'Prioritized backlog items for next sprint',
		},
		{
			id: 5,
			date: '23-10-2025',
			time: '10:00 PM',
			action: 'Remove Role',
			actionBy: 'Aisha Patel',
			role: 'Developer',
			description: 'Implemented feature to track user activity',
		},
		{
			id: 6,
			date: '24-10-2025',
			time: '08:45 PM',
			action: 'Update Permissions',
			actionBy: 'Sofia Kim',
			role: 'QA Tester',
			description: 'Conducted thorough testing on new release',
		},
		{
			id: 7,
			date: '25-10-2025',
			time: '07:30 PM',
			action: 'Accept Team Request',
			actionBy: 'Emma Thompson',
			role: 'Audit',
			description: 'Accepted join request from Emma Thompson',
		},
		{
			id: 1,
			date: '20-10-2025',
			time: '08:33 PM',
			action: 'Assign Role',
			actionBy: 'Tushar Goel',
			role: 'Manager',
			description: 'Added workflows.approve permission',
		},
		{
			id: 2,
			date: '20-10-2025',
			time: '08:33 PM',
			action: 'Assign Role',
			actionBy: 'Tushar Goel',
			role: 'Manager',
			description: 'Added workflows.approve permission',
		},
		{
			id: 3,
			date: '21-10-2025',
			time: '09:00 PM',
			action: 'Update Permissions',
			actionBy: 'Liam Johnson',
			role: 'Designer',
			description: 'Updated UI for better accessibility',
		},
		{
			id: 4,
			date: '22-10-2025',
			time: '09:15 PM',
			action: 'Assign Role',
			actionBy: 'Rajiv Singh',
			role: 'Product Owner',
			description: 'Prioritized backlog items for next sprint',
		},
		{
			id: 5,
			date: '23-10-2025',
			time: '10:00 PM',
			action: 'Remove Role',
			actionBy: 'Aisha Patel',
			role: 'Developer',
			description: 'Implemented feature to track user activity',
		},
		{
			id: 6,
			date: '24-10-2025',
			time: '08:45 PM',
			action: 'Update Permissions',
			actionBy: 'Sofia Kim',
			role: 'QA Tester',
			description: 'Conducted thorough testing on new release',
		},
		{
			id: 7,
			date: '25-10-2025',
			time: '07:30 PM',
			action: 'Accept Team Request',
			actionBy: 'Emma Thompson',
			role: 'Audit',
			description: 'Accepted join request from Emma Thompson',
		},
	]);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});

	const handleExport = () => {
		console.log('Export logs');
		// Implement export functionality
	};

	const columns = useMemo(
		() => [
			{
				accessorKey: 'date',
				header: 'Time Stamp',
				cell: ({ row }) => (
					<div className="text-[#26064A] font-medium text-sm whitespace-pre-line flex flex-col">
						<span>{row.original.date}</span>
						<span className="text-[#26064A99] text-xs">
							{row.original.time}
						</span>
					</div>
				),
			},
			{
				accessorKey: 'action',
				header: 'Actions',
				cell: ({ row }) => (
					<span className="text-[#00000099] text-sm font-medium">
						{row.original.action}
					</span>
				),
			},
			{
				accessorKey: 'actionBy',
				header: 'Action By',
				cell: ({ row }) => (
					<span className="text-[#00000099] text-sm font-medium">
						{row.original.actionBy}
					</span>
				),
			},
			{
				accessorKey: 'role',
				header: 'Description',
				cell: ({ row }) => (
					<div className="flex flex-col">
						<span className="font-medium text-sm text-[#26064A]">
							Role: {row.original.role}
						</span>
						<span className="text-[#26064A99] text-xs">
							{row.original.description}
						</span>
					</div>
				),
			},
		],
		[],
	);

	return (
		<div className="w-full h-full">
			{logs.length === 0 ? (
				<EmptyState config={EMPTY_STATE_CONFIG} />
			) : (
				<div className="space-y-5">
					<div className="flex justify-end items-center gap-4">
						{/* Export Button */}
						<button
							onClick={handleExport}
							className={cn(
								'inline-flex items-center gap-2 px-4 py-2',
								'text-[#26064A] text-sm font-medium',
								'border border-gray-200 rounded-md',
								'hover:bg-gray-50 transition-colors',
							)}
						>
							<Download className="h-4 w-4" />
							Export
						</button>
					</div>

					<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
						<DataTable
							data={logs}
							columns={columns}
							totalCount={logs.length}
							pagination={pagination}
							setPagination={setPagination}
							isServerSide={false}
							simplePagination={true}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
