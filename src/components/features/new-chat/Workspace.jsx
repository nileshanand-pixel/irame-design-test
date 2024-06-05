import { useEffect, useMemo } from 'react';
import PlannerComponent from './PlannerComponent';
import SourceComponent from './SourceComponent';
import CoderComponent from './CoderComponent';
import { WorkspaceEnum, workSpaceMap } from './types/new-chat.enum';
import GraphComponent from '@/components/elements/GraphComponent';
import { Skeleton } from '@/components/ui/skeleton';

const Workspace = ({
	handleTabClick,
	workSpaceTab,
	answerResp,
	setWorkSpaceTab,
	visitedTabs,
	setVisitedTabs,
}) => {
	useEffect(() => {
		if (!workSpaceTab && answerResp?.answer) {
			const firstTab = Object.keys(answerResp.answer)[0];
			setWorkSpaceTab(firstTab);
			setVisitedTabs((prev) => ({ ...prev, [firstTab]: true }));
		}
		setVisitedTabs((prev) => ({ ...prev, ['planner']: true }));
	}, [answerResp, setWorkSpaceTab, setVisitedTabs, workSpaceTab]);

	const renderedComponent = useMemo(() => {
		switch (workSpaceTab) {
			case WorkspaceEnum.Planner:
				return (
					<PlannerComponent
						data={answerResp?.answer?.[WorkspaceEnum.Planner]}
					/>
				);
			case WorkspaceEnum.Coder: {
				const coderData = answerResp?.answer?.[WorkspaceEnum.Coder];
				return <CoderComponent data={coderData?.tool_data} />;
			}
			case WorkspaceEnum.Graph:
				return (
					<GraphComponent
						data={answerResp?.answer?.[WorkspaceEnum.Graph]}
					/>
				);
			case WorkspaceEnum.Source:
			case WorkspaceEnum.Observation:
			case WorkspaceEnum.Answer:
			case WorkspaceEnum.Reference:
				return <SourceComponent data={answerResp?.answer?.[workSpaceTab]} />;
			default:
				return null;
		}
	}, [workSpaceTab, answerResp?.answer]);
	return (
		<div className=" rounded-2xl mt-6 max-w-[24rem]">
			<ul className="ghost-tabs relative col-span-12 mb-4 inline-flex w-full border-b border-black-10">
				{answerResp?.answer
					? Object.keys(answerResp?.answer)
							?.filter(
								(key) =>
									answerResp?.answer[key]?.tool_space ===
									'secondary',
							)
							.map((items, indx) => (
								<li
									key={indx}
									className={[
										'!pb-0 flex items-center gap-2',
										workSpaceTab === items
											? 'active-tab'
											: 'default-tab',
									].join(' ')}
									onClick={() => handleTabClick(items)}
								>
									{workSpaceMap[items]}
									{visitedTabs[items] ? null : (
										<span className="relative flex size-2 ">
											<span className="absolute inline-flex h-full w-full rounded-full bg-purple-100"></span>
											<span className="animate-ping relative inline-flex rounded-full size-2 bg-purple-100"></span>
										</span>
									)}
								</li>
							))
					: [...Array(4)]?.map((_, index) => (
							<Skeleton
								key={index}
								className="h-4 w-[150px] space-x-2 mr-2 bg-purple-8 rounded-lg mb-1"
							/>
					  ))}
			</ul>
			{answerResp?.answer ? (
				renderedComponent
			) : (
				// <Skeleton className="h-96 w-full bg-purple-8 rounded-2xl" />
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
