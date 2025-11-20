import { useState, useMemo } from 'react';
import { DataTable } from '@/components/elements/DataTable';
import DotsDropdown from '@/components/elements/DotsDropdown';
import editIcon from '@/assets/icons/edit.svg';
import SearchBar from '../../search-bar';
import deleteIcon from '@/assets/icons/delete.svg';
import CreateRoleCta from './create-role-cta';
import CloneRoleDrawer from './clone-role-drawer';
import EditPermissionsDrawer from './edit-permissions-drawer';

export default function RolePermissionTabContent() {
	const [roles, setRoles] = useState([
		{
			id: 1,
			roleName: 'Org Admin',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 2,
			roleName: 'Manager',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 3,
			roleName: 'AI Trainer',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 4,
			roleName: 'Team Lead',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 5,
			roleName: 'Accountant',
			noOfUsers: 20,
			createdBy: 'Tushar Goel',
		},
		{
			id: 6,
			roleName: 'Auditor',
			noOfUsers: 10,
			createdBy: 'Tushar Goel',
		},
		{
			id: 7,
			roleName: 'Financial Analyst',
			noOfUsers: 5,
			createdBy: 'Tushar Goel',
		},
		{
			id: 1,
			roleName: 'Org Admin',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 2,
			roleName: 'Manager',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 3,
			roleName: 'AI Trainer',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 4,
			roleName: 'Team Lead',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 5,
			roleName: 'Accountant',
			noOfUsers: 20,
			createdBy: 'Tushar Goel',
		},
		{
			id: 6,
			roleName: 'Auditor',
			noOfUsers: 10,
			createdBy: 'Tushar Goel',
		},
		{
			id: 7,
			roleName: 'Financial Analyst',
			noOfUsers: 5,
			createdBy: 'Tushar Goel',
		},
		{
			id: 1,
			roleName: 'Org Admin',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 2,
			roleName: 'Manager',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 3,
			roleName: 'AI Trainer',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 4,
			roleName: 'Team Lead',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 5,
			roleName: 'Accountant',
			noOfUsers: 20,
			createdBy: 'Tushar Goel',
		},
		{
			id: 6,
			roleName: 'Auditor',
			noOfUsers: 10,
			createdBy: 'Tushar Goel',
		},
		{
			id: 7,
			roleName: 'Financial Analyst',
			noOfUsers: 5,
			createdBy: 'Tushar Goel',
		},
		{
			id: 1,
			roleName: 'Org Admin',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 2,
			roleName: 'Manager',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 3,
			roleName: 'AI Trainer',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 4,
			roleName: 'Team Lead',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 5,
			roleName: 'Accountant',
			noOfUsers: 20,
			createdBy: 'Tushar Goel',
		},
		{
			id: 6,
			roleName: 'Auditor',
			noOfUsers: 10,
			createdBy: 'Tushar Goel',
		},
		{
			id: 7,
			roleName: 'Financial Analyst',
			noOfUsers: 5,
			createdBy: 'Tushar Goel',
		},
		{
			id: 1,
			roleName: 'Org Admin',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 2,
			roleName: 'Manager',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 3,
			roleName: 'AI Trainer',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 4,
			roleName: 'Team Lead',
			noOfUsers: 0,
			createdBy: 'System',
		},
		{
			id: 5,
			roleName: 'Accountant',
			noOfUsers: 20,
			createdBy: 'Tushar Goel',
		},
		{
			id: 6,
			roleName: 'Auditor',
			noOfUsers: 10,
			createdBy: 'Tushar Goel',
		},
		{
			id: 7,
			roleName: 'Financial Analyst',
			noOfUsers: 5,
			createdBy: 'Tushar Goel',
		},
	]);
	const [search, setSearch] = useState('');
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});
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

	const columns = useMemo(
		() => [
			{
				accessorKey: 'roleName',
				header: 'Role Name',
				cell: ({ row }) => (
					<span className="text-[#26064A] text-sm font-medium">
						{row.original.roleName}
					</span>
				),
			},
			{
				accessorKey: 'noOfUsers',
				header: 'No. of Users',
				cell: ({ row }) => (
					<span className="text-[#26064A] text-sm">
						{String(row.original.noOfUsers).padStart(2, '0')}
					</span>
				),
			},
			{
				accessorKey: 'createdBy',
				header: 'Created By',
				cell: ({ row }) => (
					<span className="text-[#26064A] text-sm">
						{row.original.createdBy}
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
							show: true,
							icon: <img src={editIcon} className="size-4" />,
						},
						{
							type: 'item',
							label: 'Duplicate Role',
							onClick: () => handleCloneRole(role),
							show: true,
							icon: (
								<span className="material-symbols-outlined text-[#26064A] text-xl">
									content_copy
								</span>
							),
						},
						{
							type: 'item',
							label: 'Remove Role',
							onClick: () => handleRemoveRole(role),
							show: true,
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

	// Filter roles based on search
	const filteredRoles = useMemo(() => {
		return roles.filter((role) =>
			role.roleName.toLowerCase().includes(search.toLowerCase()),
		);
	}, [roles, search]);

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
						data={filteredRoles}
						columns={columns}
						totalCount={filteredRoles.length}
						pagination={pagination}
						setPagination={setPagination}
						isServerSide={false}
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
