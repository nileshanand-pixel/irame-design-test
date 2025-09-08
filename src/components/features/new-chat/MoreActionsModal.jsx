import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { EVENTS_ENUM } from '@/config/analytics-events';
import { trackEvent } from '@/lib/mixpanel';
import React, { forwardRef, useEffect, useRef } from 'react';

// Action components
const QueryInBulk = forwardRef(({ onClick }, ref) => (
	<ActionButton
		icon="format_list_bulleted"
		title="Query in Bulk"
		onClick={onClick}
		ref={ref}
	/>
));

const CreateReport = forwardRef(({ onClick }, ref) => (
	<ActionButton
		icon="description"
		title="Create a Report"
		onClick={() => onClick('createReport')}
		ref={ref}
	/>
));

const CreateDashboard = forwardRef(({ onClick }, ref) => (
	<ActionButton
		icon="dashboard"
		title="Create a Dashboard"
		onClick={() => {
			onClick('createDashboard');
		}}
		ref={ref}
	/>
));

const SavedQueries = forwardRef(({ onClick }, ref) => (
	<ActionButton
		icon="bookmarks"
		title="Saved Queries"
		onClick={() => onClick('savedQueries')}
		ref={ref}
		rightIcon="chevron_right"
	/>
));

const WorkFlowQuery = forwardRef(({ onClick }, ref) => (
	<ActionButton
		icon="format_list_bulleted"
		title="Work Flow"
		onClick={onClick}
		ref={ref}
	/>
));

// Generic ActionButton component
const ActionButton = forwardRef(({ icon, title, onClick, rightIcon }, ref) => (
	<button
		onClick={onClick}
		className="w-full text-left p-2 rounded-md flex items-center space-x-2 hover:bg-[#6A12CD0A]"
		ref={ref}
	>
		<span className="material-symbols-outlined text-2xl">{icon}</span>
		<span>{title}</span>
		{rightIcon && (
			<span className="material-symbols-outlined text-2xl">{rightIcon}</span>
		)}
	</button>
));

const SavedQueryBtn = ({ onClick, title, onDelete, onEdit }) => (
	<button
		onClick={onClick}
		className="w-full text-left p-2 rounded-md flex items-center justify-between group hover:bg-[#6A12CD0A]"
	>
		<div className="flex gap-2 items-center">
			<span className="material-symbols-outlined text-2xl">
				format_list_bulleted
			</span>
			<span>{title}</span>
		</div>
		<div
			className="gap-2 text-[#26064A66] hidden group-hover:flex"
			onClick={(e) => e.stopPropagation()}
		>
			<span
				className="material-symbols-outlined hover:text-[#26064ab0] text-2xl"
				onClick={onDelete}
			>
				delete
			</span>
			<span
				className="material-symbols-outlined hover:text-[#26064ab0] text-2xl"
				onClick={onEdit}
			>
				edit
			</span>
		</div>
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

const SavedQueriesSecondaryModal = ({
	templatesData,
	handleDeleteTemplate,
	handleEditTemplate,
	handleTemplateSelect,
}) => {
	return (
		<div className="flex flex-col gap-2 max-h-[12.5rem] min-w-[17.8rem]">
			<h3 className="text-xs font-semibold text-[#26064A99] h-4 shrink-0">
				Saved Queries
			</h3>

			<div className="overflow-scroll h-full">
				{templatesData && templatesData?.length !== 0 ? (
					<div>
						{templatesData?.map((data) => {
							return (
								<SavedQueryBtn
									key={data?.external_id}
									title={data?.name}
									onClick={() =>
										handleTemplateSelect(data?.external_id)
									}
									onDelete={() =>
										handleDeleteTemplate(data?.external_id)
									}
									onEdit={() =>
										handleEditTemplate(data?.external_id)
									}
								/>
							);
						})}
					</div>
				) : (
					<div className="h-[3.125rem] flex items-center justify-center text-sm text-gray-700">
						No Saved Queries!
					</div>
				)}
			</div>
		</div>
	);
};

const secondaryModalConfig = [
	{ id: 'savedQueries-secondaryModal', component: SavedQueriesSecondaryModal },
];

const MoreActionsModal = forwardRef(
	(
		{
			config,
			onSelect,
			templatesData,
			showSecondaryModal,
			secondaryModalId,
			handleDeleteTemplate,
			handleEditTemplate,
			handleTemplateSelect,
		},
		ref,
	) => {
		// Function to render actions based on configuration
		const renderActions = () => {
			return actionConfig
				.filter((action) => config[action.id]?.enabled)
				.map((action, index) => {
					const ActionComponent = action.component;
					return (
						<ActionComponent
							key={action.id}
							onClick={() => onSelect(action.id)}
							ref={index === 0 ? ref : null}
						/>
					);
				});
		};

		const renderSecondaryModal = () => {
			const MainComponent = secondaryModalConfig?.filter(
				(data) => data?.id === secondaryModalId,
			)?.[0]?.component;

			return (
				<div className="my-1 shadow-md border border-[#26064A14] bg-white rounded-lg z-10">
					<div className="p-2">
						{MainComponent && (
							<MainComponent
								templatesData={templatesData}
								handleDeleteTemplate={handleDeleteTemplate}
								handleEditTemplate={handleEditTemplate}
								handleTemplateSelect={handleTemplateSelect}
							/>
						)}
					</div>
				</div>
			);
		};

		return (
			<div className="inline-flex items-end gap-[0.125rem]">
				<div className="top-0 left-4 w-fit my-1 ml-2 shadow-md border border-[#26064A14] bg-white rounded-lg mt-1 z-40">
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
	},
);

export default MoreActionsModal;
