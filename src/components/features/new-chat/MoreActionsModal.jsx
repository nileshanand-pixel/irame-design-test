import { DropdownMenu } from '@/components/ui/dropdown-menu';
import React, { forwardRef } from 'react';

// Action components
const QueryInBulk = forwardRef(({ onClick}, ref) => (
	<ActionButton
		icon="format_list_bulleted"
		title="Query in Bulk"
		onClick={onClick}
		ref={ref}
	/>
));

const CreateReport = forwardRef(({ onClick}, ref) => (
	<ActionButton
		icon="description"
		title="Create a Report"
		onClick={() => onClick('createReport')}
		ref={ref}
	/>
));

const CreateDashboard = forwardRef(({ onClick}, ref) => (
	<ActionButton
		icon="dashboard"
		title="Create a Dashboard"
		onClick={() => onClick('createDashboard')}
		ref={ref}
	/>
));

const SavedQueries = forwardRef(({ onClick}, ref) => (
	<ActionButton
		icon="bookmarks"
		title="Saved Queries"
		onClick={() => onClick('savedQueries')}
		ref={ref}
		rightIcon="chevron_right"
	/>
));

const WorkFlowQuery = forwardRef(({ onClick}, ref) => (
	<ActionButton
		icon="format_list_bulleted"
		title="Work Flow"
		onClick={onClick}
		ref={ref}
	/>
));

// Generic ActionButton component
const ActionButton = forwardRef(({ icon, title, onClick, rightIcon}, ref) => (
	<button
		onClick={onClick}
		className="w-full text-left p-2 rounded-md flex items-center space-x-2 hover:bg-[#6A12CD0A]"
		ref = {ref}
	>
		<span className="material-symbols-outlined">{icon}</span>
		<span>{title}</span>
		{
			rightIcon && 
			<span className="material-symbols-outlined">
				{rightIcon}
			</span>
		}
	</button>
));

const SavedQueryBtn = ({onClick, title, onDelete, onEdit}) => (
	<button
		onClick={onClick}
		className="w-full text-left p-2 rounded-md flex items-center justify-between group hover:bg-[#6A12CD0A]"
	>
		<div className="flex gap-2">
			<span className="material-symbols-outlined">format_list_bulleted</span>
			<span>{title}</span>
		</div>
		<div className="gap-2 text-[#26064A66] hidden group-hover:flex" onClick={(e) => e.stopPropagation()}>
			<span 
				className="material-symbols-outlined hover:text-[#26064ab0]"
				onClick={onDelete}
			>delete</span>
			<span 
				className="material-symbols-outlined hover:text-[#26064ab0]"
				onClick={onEdit}
			>edit</span>
		</div>
	</button>
)

// Configuration object
const actionConfig = [
	{ id: 'workflowQuery', component: WorkFlowQuery },
	{ id: 'queryInBulk', component: QueryInBulk },
	{ id: 'savedQueries', component: SavedQueries },
	{ id: 'createReport', component: CreateReport },
	{ id: 'createDashboard', component: CreateDashboard },
];

const SavedQueriesSecondaryModal = ({ savedQueriesData, handleDeleteSavedQuery, handleEditSavedQuery, handleSelectQuery }) => {
	return (
		<div className = "flex flex-col gap-2 max-h-[200px] min-w-[285px]">
			<h3 className="text-xs font-semibold text-[#26064A99] h-[16px]">
				Saved Queries
			</h3>

			<div className = "overflow-scroll h-[calc(100%-28px)]">
				{
					savedQueriesData && savedQueriesData?.length !== 0 ? (
						<div>
							{
								savedQueriesData?.saved_queries?.map((data) => {
									return <SavedQueryBtn
										key={data?.external_id}
										title={data?.name}
										onClick={() => handleSelectQuery(data?.external_id)}
										onDelete={() => handleDeleteSavedQuery(data?.external_id)}
										onEdit={() => handleEditSavedQuery(data?.external_id)}
									/>
								})
							}
						</div>
					) : (
						<div className = "h-[50px] flex items-center justify-center text-sm text-gray-700">
							No Saved Queries!
						</div>
					)
				}
			</div>
		</div>
	)
}

const secondaryModalConfig = [
	{ id: "savedQueries-secondaryModal", component: SavedQueriesSecondaryModal }
]

const MoreActionsModal = forwardRef(({ config, onSelect, savedQueriesData, showSecondaryModal, secondaryModalId, handleDeleteSavedQuery, handleEditSavedQuery, handleSelectQuery}, ref) => {
	// Function to render actions based on configuration
	const renderActions = () => {
		return actionConfig
			.filter((action) => config[action.id]?.enabled)
			.map((action, index) => {
				const ActionComponent = action.component;
				return <ActionComponent 
					key={action.id} 
					onClick={() => onSelect(action.id)} 
					ref={index === 0 ? ref : null}
				/>
			});
	};

	const renderSecondaryModal = () => {
		const MainComponent = secondaryModalConfig?.filter((data) => data?.id === secondaryModalId)?.[0]?.component;

		return (
			<div className = "my-1 shadow-lg border border-[#26064A14] bg-white rounded-lg z-10">
				<div className="p-2">
					{
						MainComponent && 
						<MainComponent 
							savedQueriesData={savedQueriesData}
							handleDeleteSavedQuery={handleDeleteSavedQuery}
							handleEditSavedQuery={handleEditSavedQuery}
							handleSelectQuery={handleSelectQuery}
						/>
					}
			 	</div>
			</div>
		)
	};

	return (
		<div className = "inline-flex items-end gap-[2px]">
			<div className="top-0 left-4 w-fit my-1 ml-2 shadow-lg border border-[#26064A14] bg-white rounded-lg mt-1 z-40">
				<div className="p-2">
					<h3 className="text-xs font-semibold text-[#26064A99] mb-2">
						More Actions
					</h3>
					{renderActions()}
				</div>
			</div>

			{showSecondaryModal && renderSecondaryModal()}
		</div>
	);
});

export default MoreActionsModal;
