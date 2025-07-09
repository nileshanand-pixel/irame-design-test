import React, { useEffect, useMemo, useState } from 'react';
import PlannerComponent from './PlannerComponent';
import SourceComponent from './SourceComponent';
import CoderComponent from './CoderComponent';
import { Skeleton } from '@/components/ui/skeleton';

import { WorkspaceEnum, workSpaceMap } from './types/new-chat.enum';

const TAB_ORDER = [
	WorkspaceEnum.Planner,
	WorkspaceEnum.Reference,
	WorkspaceEnum.Coder
];
import { useWorkspaceEdit } from './components/WorkspaceEditProvider';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useRouter } from '@/hooks/useRouter';
import { useSelector } from 'react-redux';

const Workspace = ({ handleTabClick, workspace, answerResp, setWorkspace, canEdit }) => {
	const [workspaceHasChanges, setWorkspaceHasChanges] = useState(false);
	const { regenerateResponse, editDisabled, changeSets , segments: updatedSegments} = useWorkspaceEdit();
	const { query } = useRouter();
	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);

	const availableTabs = useMemo(() => {
		return TAB_ORDER.filter(
			(tab) => answerResp?.answer?.[tab]?.tool_space === 'secondary',
		);
	}, [answerResp?.answer]);

	const renderedComponent = useMemo(() => {
		const componentMap = {
			[WorkspaceEnum.Planner]: () => (
				<PlannerComponent
					data={answerResp?.answer?.[WorkspaceEnum.Planner]}
					canEdit={ canEdit && answerResp?.type !== 'workflow'}
					workspaceHasChanges={workspaceHasChanges}
					setWorkspaceHasChanges={setWorkspaceHasChanges}
				/>
			),
			[WorkspaceEnum.Coder]: () => (
				<CoderComponent
					data={answerResp?.answer?.[WorkspaceEnum.Coder]?.tool_data?.text}
				/>
			),
			[WorkspaceEnum.Reference]: () => (
				<SourceComponent
					data={answerResp?.answer?.[workspace.activeTab]}
					datasourceId={answerResp?.datasource_id}
					status={answerResp?.status}
					workspaceHasChanges={workspaceHasChanges}
					setWorkspaceHasChanges={setWorkspaceHasChanges}
				/>
			),
		};

		return componentMap[workspace?.activeTab]?.() || null;
	}, [workspace?.activeTab, answerResp?.answer]);

	const isLoading = !answerResp?.answer || !availableTabs || !availableTabs.length;

	const renderTabs = () => {
		if (isLoading) {
			return [...Array(4)].map((_, index) => (
				<Skeleton
					key={index}
					className="h-4 w-[150px] space-x-2 mr-2 bg-purple-8 rounded-lg mb-1"
				/>
			));
		}

		return availableTabs.map((tab, index) => (
			<li
				key={index}
				className={`!pb-0 flex items-center gap-2 ${workspace.activeTab === tab ? 'active-tab' : 'default-tab'}`}
				onClick={() => handleTabClick(tab)}
			>
				{workSpaceMap[tab]}
				{!workspace.visitedTabs[tab] && (
					<span className="relative flex size-2">
						<span className="absolute inline-flex h-full w-full rounded-full bg-purple-100"></span>
						<span className="animate-ping relative inline-flex rounded-full size-2 bg-purple-100"></span>
					</span>
				)}
			</li>
		));
	};

	const showRegenerateAction = !editDisabled && workspaceHasChanges && answerResp?.type !== 'workflow';

	return (
		<div className="rounded-2xl my-6 flex-1 w-full h-full overflow-hidden relative">
			<ul className="ghost-tabs relative col-span-12 mb-4 inline-flex w-full border-b border-black-10">
				{renderTabs()}
			</ul>
			{!isLoading ? (
				<div className={`w-full ${showRegenerateAction ? 'h-[95%]': 'h-[98%]'} overflow-y-auto`}>
					{renderedComponent}
					{showRegenerateAction && (
						<div className="my-2 flex gap-4 w-full absolute bottom-10">
							<Button
								className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80 w-full"
								onClick={() => {
									const changedTabs = Object.entries(changeSets).map(([tab, isChanged]) => {
										if(isChanged) {
											return tab;
										}
									}).filter((tab) => !!tab);
									

									trackEvent(
										EVENTS_ENUM.REGENERATE_RESPONSE_CLICKED,
										EVENTS_REGISTRY.REGENERATE_RESPONSE_CLICKED,
										() => ({
											type_change: changedTabs,
											chat_session_id: query?.sessionId,
											dataset_id: utilReducer?.selectedDataSource?.id,
											dataset_name: utilReducer?.selectedDataSource?.name,
											query_id: chatStoreReducer?.activeQueryId,
										}),
									);
									regenerateResponse(answerResp);
									setWorkspaceHasChanges(false);
								}}
								disabled={editDisabled}
							>
								Regenerate Response
							</Button>
						</div>
					)}
				</div>
			) : (
				<div className="flex flex-col space-y-3">
					<div className="space-y-2">
						<Skeleton className="h-5 w-[50%] bg-purple-8" />
						<Skeleton className="h-5 w-[90%] bg-purple-8" />
					</div>
					<Skeleton className="h-[125px] w-[250px] rounded-xl bg-purple-8" />
				</div>
			)}
		</div>
	);
};

export default Workspace;
