import { DropdownMenu } from '@/components/ui/dropdown-menu';
import React from 'react';

// Action components
const QueryInBulk = ({ onClick }) => (
	<ActionButton
		icon="format_list_bulleted"
		title="Query in Bulk"
		onClick={onClick}
	/>
);

const CreateReport = ({ onClick }) => (
	<ActionButton
		icon="description"
		title="Create a Report"
		onClick={() => onClick('createReport')}
	/>
);

const CreateDashboard = ({ onClick }) => (
	<ActionButton
		icon="dashboard"
		title="Create a Dashboard"
		onClick={() => onClick('createDashboard')}
	/>
);

const SavedQueries = ({ onClick }) => (
	<ActionButton
		icon="bookmarks"
		title="Saved Queries"
		onClick={() => onClick('savedQueries')}
	/>
);

const WorkFlowQuery = ({ onClick }) => (
	<ActionButton
		icon="format_list_bulleted"
		title="Work Flow"
		onClick={onClick}
	/>
);

// Generic ActionButton component
const ActionButton = ({ icon, title, onClick }) => (
	<button
		onClick={onClick}
		className="w-full text-left p-2 rounded-md flex items-center space-x-2 hover:bg-[#6A12CD0A]"
	>
		<span className="material-symbols-outlined">{icon}</span>
		<span>{title}</span>
	</button>
);

// Configuration object
const actionConfig = [
	{ id: 'workflowQuery', component: WorkFlowQuery },
	{ id: 'queryInBulk', component: QueryInBulk },
	{ id: 'savedQueries', component: SavedQueries },
	{ id: 'createReport', component: CreateReport },
	{ id: 'createDashboard', component: CreateDashboard },
];

const MoreActionsModal = ({ config, onSelect, }) => {
	// Function to render actions based on configuration
	const renderActions = () => {
		return actionConfig
			.filter((action) => config[action.id]?.enabled)
			.map((action) => {
				const ActionComponent = action.component;
				return <ActionComponent key={action.id} onClick={() => onSelect(action.id)} />
			});
	};

	return (
			<div className="relative top-0 left-4 w-fit my-1 mx-2 shadow-lg border border-[#26064A14] bg-white rounded-lg mt-1 z-10">
				<div className="p-2">
					<h3 className="text-xs font-semibold text-[#26064A99] mb-2">
						More Actions
					</h3>
					{renderActions()}
				</div>
			</div>
	);
};

export default MoreActionsModal;
