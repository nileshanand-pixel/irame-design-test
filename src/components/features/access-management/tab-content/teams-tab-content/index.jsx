import { useState, useMemo, useEffect } from 'react';
import SearchBar from '../../search-bar';
import { DataTable } from '@/components/elements/DataTable';
import DotsDropdown from '@/components/elements/DotsDropdown';
import editIcon from '@/assets/icons/edit.svg';
import userPlusIcon from '@/assets/icons/user-plus.svg';
import { Eye, Users } from 'lucide-react';
import EmptyState from '../empty-state';
import teamsEmpty from '@/assets/icons/teams-empty.svg';
import CreateTeamCta from './create-team-cta';
import EditTeamDrawer from './edit-team-drawer';
import ManageUsersDrawer from './manage-users-drawer';
import { useTeams } from '@/hooks/use-teams';
import { useDebounce } from '@/hooks/use-debounce';

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
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 500);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const [selectedTeam, setSelectedTeam] = useState(null);
	const [isEditingTeam, setIsEditingTeam] = useState(false);
	const [isViewReadOnly, setIsViewReadOnly] = useState(false);
	const [isManageUsersDrawerOpen, setIsManageUsersDrawerOpen] = useState(false);
	const [isViewMembersReadOnly, setIsViewMembersReadOnly] = useState(false);

	// Reset to page 1 when search changes
	useEffect(() => {
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	}, [debouncedSearch]);

	const resetToFirstPage = () => {
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	};

	const queryParams = useMemo(() => {
		const params = {
			page: pagination.pageIndex + 1,
			limit: pagination.pageSize,
		};
		if (debouncedSearch.trim()) {
			params.search = debouncedSearch.trim();
		}
		return params;
	}, [debouncedSearch, pagination.pageIndex, pagination.pageSize]);

	const { data, isLoading, isFetching } = useTeams(queryParams);

	const teams = useMemo(() => {
		if (!data?.success || !data?.data) return [];
		return data.data.map((team) => ({
			id: team.id,
			teamName: team.name,
			noOfUsers: team.memberCount || 0,
			createdBy:
				typeof team.createdBy === 'object'
					? team.createdBy?.name
					: team.createdBy || 'Unknown',
			updatedBy:
				typeof team.updatedBy === 'object'
					? team.updatedBy?.name
					: team.updatedBy || 'Unknown',
			updatedAt: team.updatedAt
				? new Date(team.updatedAt).toLocaleDateString('en-GB', {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
					})
				: 'N/A',
		}));
	}, [data]);

	const totalCount = data?.pagination?.total || 0;

	const handleEditTeam = (team, readOnly = false) => {
		setSelectedTeam(team);
		setIsViewReadOnly(readOnly);
		setIsEditingTeam(true);
	};

	const handleManageUsers = (team, readOnly = false) => {
		setSelectedTeam(team);
		setIsViewMembersReadOnly(readOnly);
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
			accessorKey: 'updatedAt',
			header: 'Updated At',
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
						label: 'View Team',
						onClick: () => handleEditTeam(team, true),
						show: true,
						icon: <Eye className="size-4 text-[#26064A]" />,
					},
					{
						type: 'item',
						label: 'View Members',
						onClick: () => handleManageUsers(team, true),
						show: true,
						icon: <Users className="size-4 text-[#26064A]" />,
					},
					{
						type: 'item',
						label: 'Edit Team',
						onClick: () => handleEditTeam(team, false),
						show: true,
						icon: <img src={editIcon} className="size-4" />,
					},
					{
						type: 'item',
						label: 'Manage Users',
						onClick: () => handleManageUsers(team, false),
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

	return (
		<div className="w-full h-full">
			{!isLoading && !isFetching && teams?.length === 0 && !search ? (
				<EmptyState config={EMPTY_STATE_CONFIG} />
			) : (
				<div className="space-y-5 flex flex-col h-full">
					<div className="flex justify-between items-center flex-shrink-0">
						<div>
							<SearchBar
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<div>
							<CreateTeamCta onSuccess={resetToFirstPage} />
						</div>
					</div>

					<div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 min-h-0">
						<DataTable
							data={teams}
							columns={columns}
							totalCount={totalCount}
							pagination={pagination}
							setPagination={setPagination}
							isServerSide={true}
							isLoading={isLoading || isFetching}
							simplePagination={true}
						/>
					</div>
				</div>
			)}

			{isEditingTeam && (
				<EditTeamDrawer
					open={!!isEditingTeam}
					setOpen={setIsEditingTeam}
					team={selectedTeam}
					isReadOnly={isViewReadOnly}
				/>
			)}

			{isManageUsersDrawerOpen && selectedTeam && (
				<ManageUsersDrawer
					open={!!isManageUsersDrawerOpen}
					setOpen={setIsManageUsersDrawerOpen}
					team={selectedTeam}
					isReadOnly={isViewMembersReadOnly}
				/>
			)}
		</div>
	);
}
