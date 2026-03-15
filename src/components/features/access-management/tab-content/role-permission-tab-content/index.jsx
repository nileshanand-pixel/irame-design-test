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
import { useRoleDelete } from '@/hooks/use-role-delete';
import { useMyPermissions } from '@/hooks/use-my-permissions';
import { useRbac } from '@/hooks/useRbac';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'react-toastify';
import { Copy, Eye } from 'lucide-react';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
import { capitalizeFirstLetterFullText } from '@/lib/utils';

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
	const [isViewReadOnly, setIsViewReadOnly] = useState(false);

	// Hooks
	const { mutate: deleteRole, isPending: isDeleting } = useRoleDelete();
	const [ConfirmationDialog, confirm] = useConfirmDialog();
	const { data: myPermissions, isLoading: permissionsLoading } =
		useMyPermissions();
	const { isRbacActive } = useRbac();

	const isRoleAdmin = myPermissions.some(
		(p) => p.resource === 'role' && p.action === 'admin_manage',
	);
	const hasRolePerm = (action) =>
		permissionsLoading ||
		!isRbacActive ||
		isRoleAdmin ||
		myPermissions.some((p) => p.resource === 'role' && p.action === action);

	const canEdit = hasRolePerm('edit') || hasRolePerm('manage_permissions');
	const canClone = hasRolePerm('clone') || hasRolePerm('create');
	const canDelete = hasRolePerm('delete');

	const handleEditPermissions = (role, readOnly = false) => {
		setSelectedRole(role);
		setIsViewReadOnly(readOnly);
		setIsEditPermissionsDrawerOpen(true);
	};

	const handleCloneRole = (role) => {
		setSelectedRole(role);
		setIsCloneRoleDrawerOpen(true);
	};

	const handleRemoveRole = async (role) => {
		try {
			const confirmed = await confirm({
				header: 'Delete Role',
				description: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
				secondaryCtaText: 'Cancel',
				primaryCtaText: 'Delete Role',
				primaryCtaVariant: 'destructive',
			});

			if (!confirmed) return;

			deleteRole(role.id);
		} catch (error) {
			console.error('Error deleting role:', error);
			toast.error('Failed to delete role');
		}
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
						{capitalizeFirstLetterFullText(
							row.original.createdBy?.name,
						) || 'System'}
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
							label: 'View Role',
							onClick: () => handleEditPermissions(role, true),
							show: true,
							icon: <Eye className="size-4 text-[#26064A]" />,
						},
						{
							type: 'item',
							label: 'Edit Permissions',
							onClick: () => handleEditPermissions(role, false),
							show: !role.isSystem && canEdit,
							icon: <img src={editIcon} className="size-4" />,
						},

						{
							type: 'item',
							label: 'Duplicate Role',
							onClick: () => handleCloneRole(role),
							show: canClone,
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
							show: !role.isSystem && canDelete,
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
		[canEdit, canClone, canDelete],
	);

	return (
		<div className="w-full h-full flex flex-col">
			<div className="flex flex-col gap-5 h-full">
				<div className="flex justify-between items-center flex-shrink-0">
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

				<div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 min-h-0">
					<DataTable
						data={roles}
						columns={columns}
						totalCount={totalCount}
						pagination={pagination}
						setPagination={setPagination}
						isServerSide={true}
						isLoading={isLoading}
						simplePagination={true}
						stickyPagination={true}
						stickyHeader={true}
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
					isReadOnly={isViewReadOnly}
				/>
			)}

			<ConfirmationDialog />
		</div>
	);
}
