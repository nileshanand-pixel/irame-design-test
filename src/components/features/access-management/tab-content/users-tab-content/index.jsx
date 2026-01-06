import { useState, useEffect, useMemo } from 'react';
import EmptyState from '../empty-state';
import usersEmpty from '@/assets/icons/users-empty.svg';
import InviteUserCta from './invite-user-cta';
import { DataTable } from '@/components/elements/DataTable';
import DotsDropdown from '@/components/elements/DotsDropdown';
import editIcon from '@/assets/icons/edit.svg';
import SearchBar from '../../search-bar';
import deleteIcon from '@/assets/icons/delete.svg';
import userCrossIcon from '@/assets/icons/user-cross.svg';
import resendIcon from '@/assets/icons/resend.svg';
import EditUserDrawer from './edit-user-drawer';
import { userService } from '@/api/gatekeeper/user.service';
import { toast } from 'react-toastify';
import { useUsers } from '@/hooks/use-users';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

const EMPTY_STATE_CONFIG = {
	image: usersEmpty,
	heading: 'Welcome to Access Management!',

	descriptionLines: [
		"Your team isn't up yet. Invite collegues to collaborate,",
		'manage roles, and streeeline your workflow.',
	],
	cta: InviteUserCta,
	ctaText: 'Invite Your First User',
};

const STATUS_OPTIONS = {
	active: [
		{ label: 'Active', value: 'active' },
		{ label: 'Inactive', value: 'inactive' },
	],
	invitations: [
		{ label: 'Pending', value: 'PENDING' },
		{ label: 'Accepted', value: 'ACCEPTED' },
		{ label: 'Expired', value: 'EXPIRED' },
		{ label: 'Revoked', value: 'REVOKED' },
		{ label: 'Declined', value: 'DECLINED' },
	],
	all: [],
};

const getStatusConfig = (status) => {
	// Normalize status to handle both invitation statuses and user statuses
	const normalizedStatus = status?.toUpperCase();

	switch (normalizedStatus) {
		case 'ACTIVE':
			return {
				label: 'Active',
				textColor: '#047A48',
				dotColor: '#047A48',
				bgColor: '#ECFEF3',
			};
		case 'PENDING':
			return {
				label: 'Invite Pending',
				textColor: '#AE4408',
				dotColor: '#A74108',
				bgColor: '#FFFAEB',
			};
		case 'EXPIRED':
			return {
				label: 'Invite Expired',
				textColor: '#374151',
				dotColor: '#374151',
				bgColor: '#F3F4F6',
			};
		case 'REVOKED':
			return {
				label: 'Invite Revoked',
				textColor: '#DC2626',
				dotColor: '#DC2626',
				bgColor: '#FEE2E2',
			};
		case 'DECLINED':
			return {
				label: 'Invite Declined',
				textColor: '#DC2626',
				dotColor: '#DC2626',
				bgColor: '#FEE2E2',
			};
		case 'INACTIVE':
			return {
				label: 'Inactive',
				textColor: '#374151',
				dotColor: '#374151',
				bgColor: '#F3F4F6',
			};
		default:
			return {
				label: status || 'Unknown',
				textColor: '#374151',
				dotColor: '#374151',
				bgColor: '#F3F4F6',
			};
	}
};

export default function UsersTabContent() {
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 500);
	const [filterType, setFilterType] = useState('active'); // 'active', 'invitations', 'all'
	const [statusFilter, setStatusFilter] = useState('');
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const [isEditUserDrawerOpen, setIsEditUserDrawerOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);

	const queryParams = useMemo(() => {
		const params = {
			type: filterType,
			page: pagination.pageIndex,
			limit: pagination.pageSize,
		};
		if (debouncedSearch.trim()) {
			params.search = debouncedSearch.trim();
		}
		if (statusFilter !== '') {
			params.status = statusFilter;
		}
		return params;
	}, [
		filterType,
		statusFilter,
		debouncedSearch,
		pagination.pageIndex,
		pagination.pageSize,
	]);

	const { data, isLoading, isFetching, refetch } = useUsers(queryParams);

	const isSearching = search !== debouncedSearch;

	const users = useMemo(() => {
		if (!data?.success || !data?.data) return [];
		return data.data.map((user) => {
			const isInvitation = !!user.invitedAt;
			return {
				id: user.userId,
				name: user.name || 'Unknown User',
				email: user.email,
				role: user.role ? user.role.name : 'No Role',
				status: user.status || 'active',
				teams: user.teams || [],
				invitedAt: user.invitedAt,
				expiresAt: user.expiresAt,
				createdAt: user.createdAt,
				isInvitation,
			};
		});
	}, [data]);

	const totalCount = data?.pagination?.total || 0;

	const handleEditUser = async (user) => {
		try {
			// Fetch fresh user data from the API
			const userResponse = await userService.getUserById(user.id);
			setSelectedUser(userResponse.data);
			setIsEditUserDrawerOpen(true);
		} catch (error) {
			toast.error('Failed to load user details');
			console.error('Error fetching user details:', error);
		}
	};

	const handleSuspendUser = async (user) => {
		try {
			await userService.suspendUser(user.id);
			toast.success('User suspended successfully');
			refetch();
		} catch (error) {
			toast.error('Failed to suspend user');
		}
	};

	const handleDisableUser = async (user) => {
		try {
			await userService.disableUser(user.id);
			toast.success('User disabled successfully');
			refetch();
		} catch (error) {
			toast.error('Failed to disable user');
		}
	};

	const handleEnableUser = async (user) => {
		try {
			await userService.enableUser(user.id);
			toast.success('User enabled successfully');
			refetch();
		} catch (error) {
			toast.error('Failed to enable user');
		}
	};

	const columns = useMemo(
		() => [
			{
				accessorKey: 'name',
				header: 'Name',
				cell: ({ row }) => (
					<div>
						<div className="text-[#26064A] font-medium text-sm">
							{row.original.name}
						</div>
						<div className="text-gray-500 text-xs mt-0.5">
							@{row.original.email}
						</div>
					</div>
				),
			},
			{
				accessorKey: 'role',
				header: 'Roles',
				cell: ({ row }) => (
					<span className="text-[#26064A] text-sm">
						{row.original.role}
					</span>
				),
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ row }) => {
					const statusConfig = getStatusConfig(row.original.status);
					return (
						<div
							className="inline-flex items-center gap-2 px-2 py-1 rounded-full"
							style={{ backgroundColor: statusConfig.bgColor }}
						>
							<div
								className={`size-2 rounded-full`}
								style={{ backgroundColor: statusConfig.dotColor }}
							/>
							<span
								className={`text-sm`}
								style={{ color: statusConfig.textColor }}
							>
								{statusConfig.label}
							</span>
						</div>
					);
				},
			},
			{
				id: 'actions',
				header: 'Action',
				cell: ({ row }) => {
					const user = row.original;
					const isInvitation = user.isInvitation;
					const isPending = user.status === 'PENDING';

					const actionOptions = [
						{
							type: 'item',
							label: 'Edit User',
							onClick: () => handleEditUser(user),
							show: !isInvitation, // Only show for actual users
							icon: <img src={editIcon} className="size-4" />,
						},
						// {
						// 	type: 'item',
						// 	label:
						// 		user.status === 'active'
						// 			? 'Suspend User'
						// 			: 'Enable User',
						// 	onClick: () =>
						// 		user.status === 'active'
						// 			? handleSuspendUser(user)
						// 			: handleEnableUser(user),
						// 	show: !isInvitation, // Only show for actual users
						// 	icon: <img src={userCrossIcon} className="size-4" />,
						// },
						// {
						// 	type: 'item',
						// 	label: 'Disable User',
						// 	onClick: () => handleDisableUser(user),
						// 	show: !isInvitation, // Only show for actual users
						// 	icon: <img src={deleteIcon} className="size-4" />,
						// },
						{
							type: 'item',
							label: 'Resend Invite',
							onClick: () => console.log('Resend invite', user),
							show: isInvitation && isPending, // Only for pending invitations
							icon: <img src={resendIcon} className="size-4" />,
						},
					];

					return (
						<DotsDropdown
							options={actionOptions}
							labelClassName="text-sm text-[#26064A] font-normal"
						/>
					);
				},
			},
		],
		[],
	);

	return (
		<div className="w-full h-full">
			<div className="space-y-5">
				<div className="flex justify-between items-center gap-4">
					<SearchBar
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by name or email..."
					/>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-gray-700">
								Type:
							</label>
							<Select
								value={filterType}
								onValueChange={(value) => {
									setFilterType(value);
									setStatusFilter('');
									setPagination({
										...pagination,
										pageIndex: 0,
									});
								}}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Users</SelectItem>
									<SelectItem value="invitations">
										Invitations
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-gray-700">
								Status:
							</label>
							<Select
								value={statusFilter || 'all'}
								onValueChange={(value) => {
									setStatusFilter(value === 'all' ? '' : value);
									setPagination({
										...pagination,
										pageIndex: 0,
									});
								}}
							>
								<SelectTrigger
									className={cn(
										'w-[180px]',
										!statusFilter && 'text-muted-foreground',
									)}
								>
									<SelectValue placeholder="Choose Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem disabled value="all">
										Choose Status
									</SelectItem>
									{STATUS_OPTIONS[filterType].map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<InviteUserCta text="Invite User" onSuccess={refetch} />
					</div>
				</div>

				{isLoading && users.length === 0 ? (
					<div className="flex items-center justify-center h-64">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#26064A]"></div>
					</div>
				) : users.length === 0 &&
				  !search &&
				  filterType === 'active' &&
				  statusFilter === '' ? (
					<EmptyState config={EMPTY_STATE_CONFIG} />
				) : (
					<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
						<DataTable
							data={users}
							columns={columns}
							totalCount={totalCount}
							pagination={pagination}
							setPagination={setPagination}
							isServerSide={true}
							simplePagination={true}
							isLoading={isLoading || isFetching || isSearching}
						/>
					</div>
				)}
			</div>

			{isEditUserDrawerOpen && (
				<EditUserDrawer
					open={!!isEditUserDrawerOpen}
					setOpen={setIsEditUserDrawerOpen}
					user={selectedUser}
					onUpdate={refetch}
				/>
			)}
		</div>
	);
}
