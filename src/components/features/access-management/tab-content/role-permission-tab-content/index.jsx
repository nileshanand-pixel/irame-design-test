import { useState, useMemo } from 'react';
import { DataTable } from '@/components/elements/DataTable';
import DotsDropdown from '@/components/elements/DotsDropdown';
import editIcon from '@/assets/icons/edit.svg';
import SearchBar from '../../search-bar';
import deleteIcon from '@/assets/icons/delete.svg';
import CreateRoleCta from './create-role-cta';
import CloneRoleDrawer from './clone-role-drawer';
import EditPermissionsDrawer from './edit-permissions-drawer';
import { useRoles } from '@/hooks/use-roles';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'react-toastify';
import { Copy } from 'lucide-react';

export default function RolePermissionTabContent() {
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 500);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});

	const { data: rolesData, isLoading } = useRoles({
		page: pagination.pageIndex,
		limit: pagination.pageSize,
		search: debouncedSearch,
	});

	const roles = rolesData?.data || [];
	const totalCount = rolesData?.pagination?.total || 0;

	const [selectedRole, setSelectedRole] = useState(null);
	const [isCloneRoleDrawerOpen, setIsCloneRoleDrawerOpen] = useState(false);
	const [isEditPermissionsDrawerOpen, setIsEditPermissionsDrawerOpen] =
		useState(false);

	const handleEditPermissions = (role) => {
		setSelectedRole(role);
		setIsEditPermissionsDrawerOpen(true);
	};

	const handleCloneRole = (role) => {
		setSelectedRole(role);
		setIsCloneRoleDrawerOpen(true);
	};

	const handleRemoveRole = (role) => {
		// TODO: Implement remove role functionality
		console.log('Removing role:', role);
	};

	const handleCopyRoleId = (roleId) => {
		navigator.clipboard.writeText(roleId);
		toast.success('Role ID copied to clipboard');
	};

	const columns = useMemo(
		() => [
			{
				accessorKey: 'name',
				header: 'Role Name',
				cell: ({ row }) => (
					<span className="text-[#26064A] text-sm font-medium">
						{row.original.name}
					</span>
				),
			},
			{
				accessorKey: 'userCount',
				header: 'No. of Users',
				cell: ({ row }) => (
					<span className="text-[#26064A] text-sm">
						{String(row.original.userCount || 0).padStart(2, '0')}
					</span>
				),
			},
			{
				accessorKey: 'createdBy',
				header: 'Created By',
				cell: ({ row }) => (
					<span className="text-[#26064A] text-sm">
						{row.original.createdBy?.name || 'System'}
					</span>
				),
			},
			{
				id: 'actions',
				header: 'Action',
				cell: ({ row }) => {
					const role = row.original;
					const actionOptions = [
						{
							type: 'item',
							label: 'Edit Permissions',
							onClick: () => handleEditPermissions(role),
							show: !role.isSystem, // Only show for non-system roles
							icon: <img src={editIcon} className="size-4" />,
						},
						{
							type: 'item',
							label: 'Duplicate Role',
							onClick: () => handleCloneRole(role),
							show: true, // Show for all roles (both system and custom)
							icon: (
								<span className="material-symbols-outlined text-[#26064A] text-xl">
									content_copy
								</span>
							),
						},
						{
							type: 'item',
							label: 'Copy Role ID',
							onClick: () => handleCopyRoleId(role.id),
							show: true,
							icon: <Copy className="size-4 text-[#26064A]" />,
						},
						{
							type: 'item',
							label: 'Remove Role',
							onClick: () => handleRemoveRole(role),
							show: !role.isSystem, // Only show for non-system roles
							icon: <img src={deleteIcon} className="size-4" />,
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
				<div className="flex justify-between items-center">
					<div>
						<SearchBar
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
					<div>
						<CreateRoleCta text="Create Role" />
					</div>
				</div>

				<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
					<DataTable
						data={roles}
						columns={columns}
						totalCount={totalCount}
						pagination={pagination}
						setPagination={setPagination}
						isServerSide={true}
						isLoading={isLoading}
						simplePagination={true}
					/>
				</div>
			</div>

			{isCloneRoleDrawerOpen && (
				<CloneRoleDrawer
					open={!!isCloneRoleDrawerOpen}
					setOpen={setIsCloneRoleDrawerOpen}
					role={selectedRole}
				/>
			)}

			{isEditPermissionsDrawerOpen && (
				<EditPermissionsDrawer
					open={!!isEditPermissionsDrawerOpen}
					setOpen={setIsEditPermissionsDrawerOpen}
					role={selectedRole}
				/>
			)}
		</div>
	);
}
