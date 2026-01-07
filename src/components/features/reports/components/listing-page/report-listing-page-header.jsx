import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { TABS, VIEWS } from '../../constants';
import { useDispatch } from 'react-redux';
import { openModal } from '@/redux/reducer/modalReducer';
import { OwnerDropdown } from '@/components/elements/owner-dropdown';
import { SortDropdown } from '@/components/elements/sorting-dropdown';

const ViewToggle = ({ view, setView }) => {
	return (
		<div className="flex items-center gap-0.5 rounded-lg mr-4 bg-white relative border-1 border-purple-10">
			{Object.values(VIEWS).map((currentView) => {
				const isSelected = currentView.key === view.key;
				const Icon = currentView?.icon;

				return (
					<Button
						size="icon"
						variant="outline"
						key={currentView.key}
						onClick={() => setView(currentView)}
						className={`
							flex items-center justify-center w-10 h-10 rounded-lg transition-all bg-transparent hover:bg-transparent
							${isSelected ? 'border-2 border-purple-20' : 'border-none'}
						`}
					>
						<Icon
							className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-primary60'}`}
						/>
					</Button>
				);
			})}
		</div>
	);
};

// const TEAM_OPTIONS = [
// 	{ value: 'all', label: 'All Teams' },
// 	{ value: 'my_team', label: 'My Team' },
// ];

// export function TeamDropdown({ value, onChange }) {
// 	return (
// 		<SearchableDropdown
// 			options={TEAM_OPTIONS}
// 			value={value}
// 			onChange={onChange}
// 			placeholder="teams"
// 			searchPlaceholder="Search Teams"
// 			buttonLabel="All Teams"
// 		/>
// 	);
// }

const ReportListingPageHeader = ({
	view,
	onViewChange,
	activeTab,
	onActiveTabChange,
	search,
	onSearchChange,
	sortValue,
	onSortValueChange,
	// teamFilter,
	// onTeamFilterChange,
	ownerFilter,
	onOwnerFilterChange,
	// displayReportsCount = 0,
}) => {
	const dispatch = useDispatch();

	const handleCreateReport = () => {
		dispatch(
			openModal({
				modalName: 'createReport',
				revalidateQuery: ['user-reports'],
			}),
		);
	};

	return (
		<div className="w-full flex flex-col gap-4">
			<div className="flex items-center gap-8 border-b-2 transition-colors duration-300">
				{Object.values(TABS).map((t) => {
					if (!t.isVisible) return;
					const isActive = activeTab.key === t.key;

					return (
						<button
							key={t}
							onClick={() => onActiveTabChange(t)}
							className={cn(
								'text-sm font-semibold pb-2 relative flex items-center gap-2 transition-all duration-300 ease-in-out',
								isActive ? 'text-primary80' : 'text-primary60',
							)}
						>
							{t?.label}
							{/* {isActive && (
								<div className="animate-in fade-in duration-300">
									<FileCountChip count={displayReportsCount} />
								</div>
							)} */}
							{isActive && (
								<span className="absolute left-0 right-0 -bottom-[0.125rem] mx-auto h-1 w-full bg-primary rounded-full"></span>
							)}
						</button>
					);
				})}
			</div>

			<div className="flex justify-between items-center">
				<div
					className={cn(
						'flex items-center border border-primary20 rounded-lg px-4 h-10 bg-white w-64',
					)}
				>
					<i className="bi-search text-primary40 mr-2" />
					<Input
						placeholder="Search Reports"
						className="border-none shadow-none p-0 text-sm bg-transparent placeholder:text-primary40 text-primary80"
						value={search}
						onChange={(e) =>
							onSearchChange && onSearchChange(e.target.value)
						}
					/>
				</div>

				<div className="flex items-center">
					{activeTab.key === TABS.SHARED_REPORTS.key && (
						<>
							{/* <TeamDropdown value={teamFilter} onChange={setTeamFilter} /> */}
							<OwnerDropdown
								value={ownerFilter}
								onChange={onOwnerFilterChange}
							/>
						</>
					)}

					<SortDropdown value={sortValue} onChange={onSortValueChange} />

					<ViewToggle view={view} setView={onViewChange} />

					{activeTab.key === TABS.MY_REPORTS.key && (
						<Button
							className="bg-primary hover:opacity-90 text-sm font-medium text-white rounded-lg px-3 py-2 flex items-center gap-0"
							onClick={handleCreateReport}
							variant="primary"
						>
							<Plus className="w-4 h-4 mr-2" />
							Create New
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};

export default ReportListingPageHeader;
