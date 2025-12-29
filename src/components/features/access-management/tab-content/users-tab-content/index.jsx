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
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [filterType, setFilterType] = useState('active'); // 'active', 'invited', 'all'
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const [totalCount, setTotalCount] = useState(0);
	const [isEditUserDrawerOpen, setIsEditUserDrawerOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const params = {
				type: filterType, // 'active', 'invited', or 'all'
				page: pagination.pageIndex,
				limit: pagination.pageSize,
			};
			if (search.trim()) {
				params.search = search.trim();
			}
			const response = await userService.getUsers(params);

			if (response.success) {
				// Map API response to UI format
				const mappedUsers = response.data.map((user) => {
					// Determine if this is an invitation or a real user
					// Invitations have invitedAt field, users have createdAt
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
						isInvitation, // Flag to identify invitation vs user
					};
				});
				setUsers(mappedUsers);
				setTotalCount(response.pagination.total || mappedUsers.length);
			}
		} catch (error) {
			console.error('Failed to fetch users:', error);
			toast.error('Failed to load users');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, [pagination.pageIndex, pagination.pageSize, filterType, search]);

	// Note: Search is now handled server-side, so no need for client-side filtering
	const filteredUsers = useMemo(() => {
		return users;
	}, [users]);

	const handleEditUser = (user) => {
		setSelectedUser(user);
		setIsEditUserDrawerOpen(true);
	};

	const handleSuspendUser = async (user) => {
		try {
			await userService.suspendUser(user.id);
			toast.success('User suspended successfully');
			fetchUsers();
		} catch (error) {
			toast.error('Failed to suspend user');
		}
	};

	const handleDisableUser = async (user) => {
		try {
			await userService.disableUser(user.id);
			toast.success('User disabled successfully');
			fetchUsers();
		} catch (error) {
			toast.error('Failed to disable user');
		}
	};

	const handleEnableUser = async (user) => {
		try {
			await userService.enableUser(user.id);
			toast.success('User enabled successfully');
			fetchUsers();
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
						{
							type: 'item',
							label:
								user.status === 'active'
									? 'Suspend User'
									: 'Enable User',
							onClick: () =>
								user.status === 'active'
									? handleSuspendUser(user)
									: handleEnableUser(user),
							show: !isInvitation, // Only show for actual users
							icon: <img src={userCrossIcon} className="size-4" />,
						},
						{
							type: 'item',
							label: 'Disable User',
							onClick: () => handleDisableUser(user),
							show: !isInvitation, // Only show for actual users
							icon: <img src={deleteIcon} className="size-4" />,
						},
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
			{loading && users.length === 0 ? (
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#26064A]"></div>
				</div>
			) : users.length === 0 ? (
				<EmptyState config={EMPTY_STATE_CONFIG} />
			) : (
				<div className="space-y-5">
					<div className="flex justify-between items-center gap-4">
						<div className="flex items-center gap-3">
							<SearchBar
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search by name or email..."
							/>
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-gray-700">
									Show:
								</label>
								<select
									value={filterType}
									onChange={(e) => {
										setFilterType(e.target.value);
										setPagination({
											...pagination,
											pageIndex: 0,
										});
									}}
									className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#26064A]"
								>
									<option value="active">Active Users</option>
									<option value="invited">Invitations</option>
									<option value="all">
										All Users & Invitations
									</option>
								</select>
							</div>
						</div>
						<div>
							<InviteUserCta
								text="Invite User"
								onSuccess={fetchUsers}
							/>
						</div>
					</div>

					<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
						<DataTable
							data={filteredUsers}
							columns={columns}
							totalCount={totalCount}
							pagination={pagination}
							setPagination={setPagination}
							isServerSide={true}
							simplePagination={true}
							isLoading={loading}
						/>
					</div>
				</div>
			)}

			{isEditUserDrawerOpen && (
				<EditUserDrawer
					open={!!isEditUserDrawerOpen}
					setOpen={setIsEditUserDrawerOpen}
					user={selectedUser}
					onUpdate={fetchUsers}
				/>
			)}
		</div>
	);
}
