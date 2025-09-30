import React, { useEffect, useMemo, useState } from 'react';
import PlannerComponent from './PlannerComponent';
import SourceComponent from './SourceComponent';
import CoderComponent from './CoderComponent';
import { Skeleton } from '@/components/ui/skeleton';

import { WorkspaceEnum, workSpaceMap } from './types/new-chat.enum';

const TAB_ORDER = [
	WorkspaceEnum.Planner,
	WorkspaceEnum.Reference,
	WorkspaceEnum.Coder,
];
import { useWorkspaceEdit } from './components/WorkspaceEditProvider';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useRouter } from '@/hooks/useRouter';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';

const Workspace = ({
	handleTabClick,
	workspace,
	answerResp,
	setWorkspace,
	canEdit,
}) => {
	const [workspaceHasChanges, setWorkspaceHasChanges] = useState(false);
	const {
		regenerateResponse,
		editDisabled,
		changeSets,
		segments: updatedSegments,
	} = useWorkspaceEdit();
	const { query } = useRouter();
	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);

	const { data: datasourceData } = useDatasourceDetailsV2();
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
					canEdit={canEdit && answerResp?.type !== 'workflow'}
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
					canEdit={canEdit}
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
					className="h-4 w-[9.375rem] space-x-2 mr-2 bg-purple-8 rounded-lg mb-1"
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

	const showRegenerateAction =
		!editDisabled && workspaceHasChanges && answerResp?.type !== 'workflow';

	return (
		<div className="rounded-2xl mt-3 flex-1 w-full h-full overflow-hidden relative flex flex-col gap-4">
			<ul className="ghost-tabs relative inline-flex w-full border-b border-black-10 shrink-0">
				{renderTabs()}
			</ul>
			{!isLoading ? (
				<div
					className={cn(
						'overflow-y-auto h-full',
						showRegenerateAction && 'mb-[4rem]',
					)}
				>
					{renderedComponent}
					{showRegenerateAction && (
						<div className="my-2 flex gap-4 w-full absolute bottom-1">
							<Button
								className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80 w-full"
								onClick={() => {
									const changedTabs = Object.entries(changeSets)
										.map(([tab, isChanged]) => {
											if (isChanged) {
												return tab;
											}
										})
										.filter((tab) => !!tab);

									trackEvent(
										EVENTS_ENUM.REGENERATE_RESPONSE_CLICKED,
										EVENTS_REGISTRY.REGENERATE_RESPONSE_CLICKED,
										() => ({
											type_change: changedTabs,
											chat_session_id: query?.sessionId,
											dataset_id:
												datasourceData?.datasource_id,
											dataset_name: datasourceData?.name,
											query_id:
												chatStoreReducer?.activeQueryId,
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
					<Skeleton className="h-[7.8rem] w-[15.625rem] rounded-xl bg-purple-8" />
				</div>
			)}
		</div>
	);
};

export default Workspace;
