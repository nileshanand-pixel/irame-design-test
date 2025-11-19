import { useState } from 'react';
import SearchBar from '../../search-bar';
import { DataTable } from '@/components/elements/DataTable';
import DotsDropdown from '@/components/elements/DotsDropdown';
import editIcon from '@/assets/icons/edit.svg';
import userPlusIcon from '@/assets/icons/user-plus.svg';
import EmptyState from '../empty-state';
import teamsEmpty from '@/assets/icons/teams-empty.svg';
import CreateTeamCta from './create-team-cta';
import EditTeamDrawer from './edit-team-drawer';
import ManageUsersDrawer from './manage-users-drawer';

const EMPTY_STATE_CONFIG = {
	image: teamsEmpty,
	heading: 'Build Your Dream Team',
	descriptionLines: [
		'Collaborate with colleagues, assign roles, and streamline',
		'workflows by creating your first team.',
	],
	cta: CreateTeamCta,
	ctaText: 'Create Your First Team',
};

export default function TeamsTabContent() {
	const [teams, setTeams] = useState([
		{
			id: 1,
			teamName: 'Auditors',
			noOfUsers: 0,
			createdBy: 'Current User',
			updatedBy: 'Current User',
			updatedAt: '12-10-2025',
		},
		{
			id: 2,
			teamName: 'Financial Analysts',
			noOfUsers: 2,
			createdBy: 'Sofia Li',
			updatedBy: 'Sofia Li',
			updatedAt: '02-20-2026',
		},
		{
			id: 3,
			teamName: 'Compliance Officers',
			noOfUsers: 1,
			createdBy: 'Ravi Kumar',
			updatedBy: 'Ravi Kumar',
			updatedAt: '01-15-2026',
		},
		{
			id: 4,
			teamName: 'Internal Controllers',
			noOfUsers: 4,
			createdBy: 'Tushar Goel',
			updatedBy: 'Tushar Goel',
			updatedAt: '03-25-2026',
		},
		{
			id: 5,
			teamName: 'Internal Controllers',
			noOfUsers: 3,
			createdBy: 'Tushar Goel',
			updatedBy: 'Tushar Goel',
			updatedAt: '03-25-2026',
		},
		{
			id: 6,
			teamName: 'External Controllers',
			noOfUsers: 3,
			createdBy: 'Tushar Goel',
			updatedBy: 'Tushar Goel',
			updatedAt: '03-25-2026',
		},
		{
			id: 7,
			teamName: 'User Interface Components',
			noOfUsers: 3,
			createdBy: 'Tushar Goel',
			updatedBy: 'Tushar Goel',
			updatedAt: '03-25-2026',
		},
		{
			id: 1,
			teamName: 'Auditors',
			noOfUsers: 0,
			createdBy: 'Current User',
			updatedBy: 'Current User',
			updatedAt: '12-10-2025',
		},
		{
			id: 2,
			teamName: 'Financial Analysts',
			noOfUsers: 2,
			createdBy: 'Sofia Li',
			updatedBy: 'Sofia Li',
			updatedAt: '02-20-2026',
		},
		{
			id: 3,
			teamName: 'Compliance Officers',
			noOfUsers: 1,
			createdBy: 'Ravi Kumar',
			updatedBy: 'Ravi Kumar',
			updatedAt: '01-15-2026',
		},
		{
			id: 4,
			teamName: 'Internal Controllers',
			noOfUsers: 4,
			createdBy: 'Tushar Goel',
			updatedBy: 'Tushar Goel',
			updatedAt: '03-25-2026',
		},
		{
			id: 5,
			teamName: 'Internal Controllers',
			noOfUsers: 3,
			createdBy: 'Tushar Goel',
			updatedBy: 'Tushar Goel',
			updatedAt: '03-25-2026',
		},
		{
			id: 6,
			teamName: 'External Controllers',
			noOfUsers: 3,
			createdBy: 'Tushar Goel',
			updatedBy: 'Tushar Goel',
			updatedAt: '03-25-2026',
		},
		{
			id: 7,
			teamName: 'User Interface Components',
			noOfUsers: 3,
			createdBy: 'Tushar Goel',
			updatedBy: 'Tushar Goel',
			updatedAt: '03-25-2026',
		},
	]);
	const [search, setSearch] = useState('');
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const [selectedTeam, setSelectedTeam] = useState(null);
	const [isEditingTeam, setIsEditingTeam] = useState(false);
	const [isManageUsersDrawerOpen, setIsManageUsersDrawerOpen] = useState(false);

	const handleEditTeam = (team) => {
		setSelectedTeam(team);
		setIsEditingTeam(true);
	};

	const handleManageUsers = (team) => {
		setSelectedTeam(team);
		setIsManageUsersDrawerOpen(true);
	};

	const columns = [
		{
			accessorKey: 'teamName',
			header: 'Team Name',
			cell: ({ row }) => row.original.teamName,
		},
		{
			accessorKey: 'noOfUsers',
			header: 'No. of Users',
			cell: ({ row }) => String(row.original.noOfUsers).padStart(2, '0'),
		},
		{
			accessorKey: 'createdBy',
			header: 'Created by',
			cell: ({ row }) => row.original.createdBy,
		},
		{
			accessorKey: 'updatedBy',
			header: 'Updated By',
			cell: ({ row }) => row.original.updatedAt,
		},
		{
			id: 'actions',
			header: 'Action',
			cell: ({ row }) => {
				const team = row.original;
				const actionOptions = [
					{
						type: 'item',
						label: 'Edit Team',
						onClick: () => handleEditTeam(team),
						show: true,
						icon: <img src={editIcon} className="size-4" />,
					},
					{
						type: 'item',
						label: 'Manage Users',
						onClick: () => handleManageUsers(team),
						show: true,
						icon: <img src={userPlusIcon} className="size-4" />,
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
	];

	// Filter teams based on search
	const filteredTeams = teams.filter((team) =>
		team.teamName.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="w-full h-full">
			{teams?.length === 0 ? (
				<EmptyState config={EMPTY_STATE_CONFIG} />
			) : (
				<div className="space-y-5">
					<div className="flex justify-between items-center">
						<div>
							<SearchBar
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<div>
							<CreateTeamCta />
						</div>
					</div>

					<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
						<DataTable
							data={filteredTeams}
							columns={columns}
							totalCount={filteredTeams.length}
							pagination={pagination}
							setPagination={setPagination}
							isServerSide={false}
							simplePagination={true}
						/>
					</div>
				</div>
			)}

			<EditTeamDrawer
				open={!!isEditingTeam}
				setOpen={setIsEditingTeam}
				team={selectedTeam}
			/>

			<ManageUsersDrawer
				open={!!isManageUsersDrawerOpen}
				setOpen={setIsManageUsersDrawerOpen}
				team={selectedTeam}
			/>
		</div>
	);
}
