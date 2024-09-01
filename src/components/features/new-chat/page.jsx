import useLocalStorage from '@/hooks/useLocalStorage';
import { welcomeTypography } from './config';
import { useEffect, useState } from 'react';
import ConnectDataSource from './ConnectDataSource';
import SelectPrompt from './SelectPromt';
import AnalysisData from './AnalysisData';
import { useRouter } from '@/hooks/useRouter';
import { cn, getToken, getInitials } from '@/lib/utils';
import ira from '@/assets/icons/ira_icon.svg';
import failedIcon from '@/assets/icons/failed_icon.svg';
import warningIcon from '@/assets/icons/warning_icon.svg';
import { Button } from '@/components/ui/button';
import Workspace from './Workspace';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ResponseCard from './ResponseCard';
import {
	createQuery,
	createQuerySession,
	getQueryAnswers,
	getUserDetails,
	getUserSession,
} from './service/new-chat.service';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useSelector, useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { getDataSources } from '../configuration/service/configuration.service';
import AddQueryToDashboard from './AddQueryToDashboard';
import { createDashboard } from '../dashboard/service/dashboard.service';
import { toast } from 'sonner';
import CreateDashboardDialog from '../dashboard/components/CreateDashboardDialog';
import { queryClient } from '@/lib/react-query';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { useQuery } from '@tanstack/react-query';
import { getUserDetailsFromToken } from '@/lib/cookies';
import capitalize from 'lodash.capitalize';
import { updateAuthStoreProp } from '@/redux/reducer/authReducer';

const NewChat = () => {
	const [value, updateValue] = useLocalStorage('userDetails');
	// const [answerConfig, setAnswerConfig] = useLocalStorage('answerRespConfig');
	const [dataSource] = useLocalStorage('dataSource');
	// const [promptQuery, setPromptQuery] = useLocalStorage('questionPrompt');
	const [searchParam, setSearchParam] = useSearchParams();

	const { query, params, navigate, pathname } = useRouter();

	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const dispatch = useDispatch();

	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState(0);
	const [showRenameDialog, setShowRenameDialog] = useState(false);
	const [completedSteps, setCompletedSteps] = useState([1]);
	const [prompt, setPrompt] = useState('');
	const [showWorkspace, setShowWorkspace] = useState(true);
	const [workSpaceTab, setWorkSpaceTab] = useState('');
	const [doingScience, setDoingScience] = useState(true);
	const [answersList, setAnswersList] = useState([]);
	const [promptQuery, setPromptQuery] = useState({ data: '' });
	const [showResponseDelayBanner, setShowResponseDelayBanner] = useState(false);
	const [showFailedResponseBanner, setShowFailedResponseBanner] = useState(false);
	const [responseTimeElapsed, setResponseTimeElapsed] = useState(0);
	const [isGraphLoading, setIsGraphLoading] = useState(true);
	const [visitedTabs, setVisitedTabs] = useState({});
	const [showAddToDashboard, setShowAddToDashboard] = useState(false);
	const [showCreateDashboard, setShowCreateDashboard] = useState(false);
	const [errors, setErrors] = useState({});
	const [dashboardName, setDashboardName] = useState('');
	const [isCreatingDashboard, setIsCreatingDashboard] = useState(false);
	const [isTableLoading, setIsTableLoading] = useState(false);
	const [activeQuery, setActiveQuery] = useState({ id: query.queryId || null });

	const gradientText = {
		backgroundImage:
			'linear-gradient(270deg, rgba(106, 18, 205, 0.4), rgba(106, 18, 205, 0.8))',
		backgroundClip: 'text',
		WebkitBackgroundClip: 'text',
		color: 'transparent',
	};

	const showProgress = (itemCurrent) => {
		try {
			let tempCssClass = ``;
			if (completedSteps?.includes(itemCurrent)) {
				tempCssClass += `bg-purple-100 cursor-pointer`;
				return tempCssClass;
			} else {
				tempCssClass += `bg-purple-16`;
				return tempCssClass;
			}
		} catch (error) {
			console.log(error);
		}
	};

	const handleFileUpload = (files) => {
		// Simulating file upload with setTimeout
		setShowRenameDialog(true);
		let totalSize = 0;
		files.forEach((file) => {
			totalSize += file.size;
		});
		let uploadedSize = 0;
		files.forEach((file) => {
			setTimeout(() => {
				uploadedSize += file.size;
				const progressPercentage = (uploadedSize / totalSize) * 100;
				setProgress(parseInt(progressPercentage));
			}, 3000);
		});
	};

	const handleNextStep = (step) => {
		setCompletedSteps([...completedSteps, step]);
	};

	const renderComponent = () => {
		switch (completedSteps[completedSteps.length - 1]) {
			case 1:
				return (
					<ConnectDataSource
						files={files}
						setFiles={setFiles}
						progress={progress}
						handleFileUpload={handleFileUpload}
						handleNextStep={handleNextStep}
					/>
				);
			case 2:
				return <AnalysisData />;
			case 3:
				return (
					<SelectPrompt
						handleNextStep={handleNextStep}
						setPrompt={setPrompt}
						setAnswerResp={setAnswersList}
						setPromptQuery={setPromptQuery}
						setDoingScience={setDoingScience}
					/>
				);
			default:
				return <div>Chat / Converse</div>;
		}
	};

	const handleTabClick = (tab) => {
		setVisitedTabs({ ...visitedTabs, [tab]: true });
		setWorkSpaceTab(tab);
	};

	const handleAppendQuery = () => {
		setDoingScience(true);
		setPromptQuery({ data: prompt });
		let parentQueryId = query?.queryId;
		let lastQueryAnsObj = getCurrentQueryAns(parentQueryId);
		createQuery(
			{
				child_no: parseInt(lastQueryAnsObj.child_no) + 1,
				datasource_id: query.dataSourceId,
				parent_query_id: query.queryId,
				query: prompt,
				session_id: query.sessionId,
			},
			getToken(),
		).then((res) => {
			setActiveQuery((prevState) => ({ ...prevState, id: res.query_id }));
		});
	};

	const handleQueryAnswer = () => {
		try {
			if (!prompt || !prompt?.trim()) return;
			navigate(`/app/new-chat/session`);
			dispatch(
				updateChatStoreProp([
					{ key: 'queries', value: [{ id: '', question: prompt }] },
					{ key: 'refreshChat', value: !chatStoreReducer?.refreshChat },
				]),
			);
			createQuerySession(query.dataSourceId, prompt, getToken()).then(
				(res) => {
					dispatch(
						updateChatStoreProp([
							{
								key: 'queries',
								value: [
									{
										id: res?.query_id || '',
										question: res?.query || prompt,
									},
								],
							},
							{
								key: 'activeChatSession',
								value: {
									id: res?.session_id,
									title: res?.query || '',
								},
							},
							{ key: 'activeQueryId', value: res?.query_id },
						]),
					);
				},
			);
		} catch (error) {
			console.log(error);
		}
	};

	const fetchUserSession = () => {
		try {
			// if (utilReducer?.sessionHistory?.length > 0) return;
			getUserSession(getToken()).then((res) => {
				dispatch(updateUtilProp([{ key: 'sessionHistory', value: res }]));
				if (!authStoreReducer?.userId)
					dispatch(
						updateAuthStoreProp([
							{ key: 'userId', value: res?.[0]?.user_id },
						]),
					);
			});
		} catch (error) {
			console.error('Error fetching user session:', error);
		}
	};

	const fetchDataSources = async () => {
		const token = getToken();
		if (!token) {
			throw new Error('No token available');
		}
		const data = await getDataSources(token);
		return Array.isArray(data) ? data : [];
	};

	const {
		data: dataSources,
		isLoading,
		error,
	} = useQuery({
		queryKey: 'data-sources',
		queryFn: fetchDataSources,
		onSuccess: (data) => {
			dispatch(updateUtilProp([{ key: 'dataSources', value: data }]));
		},
		enabled: !!getToken(), // Only run the query if the token exists
	});

	const getChatHistoryDataSourceName = (dataSourceId) => {
		const dataSource = dataSources?.find(
			(source) => source.datasource_id === dataSourceId,
		);
		return dataSource?.name;
	};

	const handlePromptChange = (e) => {
		try {
			const { value } = e.target;
			console.log('prompt:', value);
			setPrompt(value);
		} catch (error) {
			console.log(error);
		}
	};

	const handleCreateNewDashboard = async () => {
		try {
			if (!dashboardName) {
				setErrors({ dashboardName: 'Please enter dashboard name' });
				return;
			}
			setIsCreatingDashboard(true);
			const resp = await createDashboard(getToken(), dashboardName);
			if (resp) {
				setIsCreatingDashboard(false);
				setShowCreateDashboard(false);
				toast.success('Dashboard created successfully');
				if (pathname == '/app/dashboard') {
					navigate(`/app/new-chat`);
				} else if (pathname == '/app/new-chat/') {
					queryClient.invalidateQueries(['user-dashboard'], {
						refetchActive: true,
						refetchInactive: true,
					});
				}
			}
		} catch (error) {
			setIsCreatingDashboard(false);
			console.log('dashboard create error', error);
			toast.error('Something went wrong while creating dashboard');
		}
	};

	useEffect(() => {
		fetchUserSession();
	}, []);

	useEffect(() => {
		let intervalId;

		const handleResponseDelay = (newElapsedTime) => {
			if (newElapsedTime >= 30 && !showResponseDelayBanner) {
				setShowResponseDelayBanner(true);
			}
			if (newElapsedTime >= 600 && !showFailedResponseBanner) {
				setShowFailedResponseBanner(true);
				setShowResponseDelayBanner(false); // Reset delay banner when failed response banner is shown
				clearInterval(intervalId);
			}
		};

		if (query?.step) {
			setCompletedSteps((prev) => [...prev, parseInt(query.step)]);

			if (query.step === '3') {
				setCompletedSteps([1, 3]);
			}
		} else {
			setCompletedSteps([1]);
		}

		return () => {
			clearInterval(intervalId);
		};
	}, [
		query?.step,
		query?.queryId,
		dispatch,
		getToken(),
		promptQuery.data,
		utilReducer?.promptQuery,
	]);

	useEffect(() => {
		setIsGraphLoading(true);
		setDoingScience(true);
		// setAnswerResp([]);
		setShowResponseDelayBanner(false);
		setShowFailedResponseBanner(false);
		setResponseTimeElapsed(0);
		setPromptQuery({ data: utilReducer?.queryPrompt });
		if (query.step === '4' && query.src === 'history') {
			// setAnswerResp(utilReducer?.answerFromHistory);
			setPromptQuery({ data: utilReducer?.queryPrompt });
			setDoingScience(false);
			if (utilReducer?.answerFromHistory?.status === 'done') {
				setIsGraphLoading(false);
			}
			// setAnswerConfig(utilReducer?.answerFromHistory?.answer);
		}
	}, [
		query.dataSourceId,
		query.sessionId,
		query.queryId,
		utilReducer?.answerFromHistory,
	]);

	useEffect(() => {
		if (!utilReducer?.selectedDataSource && dataSource?.name) {
			dispatch(
				updateUtilProp([
					{ key: 'selectedDataSource', value: dataSource?.name },
				]),
			);
		} else {
			dispatch(
				updateUtilProp([
					{
						key: 'selectedDataSource',
						value: getChatHistoryDataSourceName(query.dataSourceId),
					},
				]),
			);
		}
		if (utilReducer?.resetChat) {
			setDoingScience(true);
		}
	}, [utilReducer?.dataSources, utilReducer?.resetChat]);

	const renderConversation = () => {
		return answersList?.map((answerElem, key) => {
			const hasIraGeneratedReply = answerElem?.answer; // complete initial reply object.
			const hasIraGeneratedGraph = answerElem?.answer?.graph;
			const isIraGeneratingGraph =
				hasIraGeneratedReply &&
				!hasIraGeneratedGraph &&
				answerElem?.status !== 'done';
			const hasIraGeneratedMainReply = answerElem?.answer?.answer; // text reply of asked query
			const isGraphProcessed =
				answerElem?.answer?.graph ||
				(!answerElem?.answer?.graph &&
					!isGraphLoading &&
					answerElem?.status === 'done'); //either graph present or graph not availble for this query
			const isGettingLateInReply =
				!hasIraGeneratedGraph ||
				!hasIraGeneratedMainReply ||
				!answerElem?.answer?.response_dataframe;
			return (
				<div key={answerElem.query_id}>
					{utilReducer?.selectedDataSource?.name && (
						<div className="mt-2 mb-8 rounded-lg px-5 py-2 bg-purple-4 float-right text-primary80 font-medium max-w-[220px] truncate">
							<i className="bi-database-check mr-2 text-primary80"></i>
							{utilReducer?.selectedDataSource?.name}
						</div>
					)}
					<div className="max-h-[45rem] overflow-y-auto mt-16 w-full">
						<div className="flex items-center gap-2">
							<Avatar className="size-9">
								<AvatarImage src={value?.avatar} />
								<AvatarFallback>
									{getInitials(value.userName)}
								</AvatarFallback>
							</Avatar>
							{answerElem?.query ? (
								<p className="ms-1 bg-purple-4 text-primary80 font-medium px-4 py-2 rounded-tl-[80px] rounded-tr-[6px] rounded-br-[80px] rounded-bl-[80px]">
									{answerElem.query}
								</p>
							) : (
								<>
									<Skeleton className="h-6 w-[90%] bg-purple-8 ms-1" />
								</>
							)}
						</div>
						<div className="mt-10 flex items-center space-x-2">
							<img src={ira} alt="ira" className="size-10" />
							<Button
								variant="outline"
								className="text-sm font-semibold text-purple-100 hover:bg-white hover:text-purple-100 hover:opacity-80 flex items-center"
								onClick={() => setShowWorkspace(!showWorkspace)}
							>
								<img
									src="https://d2vkmtgu2mxkyq.cloudfront.net/category.svg"
									className="me-1 size-4"
								/>
								{showWorkspace ? 'Hide' : 'Show'} Workspace
							</Button>
						</div>
						<div className="mt-8 mb-20">
							{/* Generating Graph Loader */}
							{(answerElem.query_id === activeQuery.id &&
								doingScience) ||
							isIraGeneratingGraph ? (
								showFailedResponseBanner ? (
									<div className="flex items-center justify-center p-3 mt-3 ml-12 border border-black/5 shadow-sm w-fit rounded-lg text-sm font-semibold text-primary80">
										<img
											src={failedIcon}
											width={40}
											height={40}
											className="mr-3"
										/>
										Failed to generate a response, please refresh
										the page to try again.
									</div>
								) : (
									<div className="darkSoul-glowing-button2 ml-12">
										<button
											className="darkSoul-button2"
											type="button"
										>
											<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
											Generating Graph...
										</button>
									</div>
								)
							) : (
								<ResponseCard
									answerResp={answerElem}
									isGraphLoading={isGraphLoading}
									setIsGraphLoading={setIsGraphLoading}
									setShowFailedResponseBanner={
										setShowFailedResponseBanner
									}
									handleNextStep={handleNextStep}
									setAnswerResp={setAnswersList}
									setPromptQuery={setPromptQuery}
									setDoingScience={setDoingScience}
									setResponseTimeElapsed={setResponseTimeElapsed}
									setShowResponseDelayBanner={
										setShowResponseDelayBanner
									}
									doingScience={doingScience}
									setShowAddToDashboard={setShowAddToDashboard}
									showTable={
										!answerElem?.answer?.response_dataframe &&
										answerElem?.answer?.graph
									}
									setIsTableLoading={setIsTableLoading}
									isTableLoading={isTableLoading}
								/>
							)}

							{/* Generating Observation Loader */}
							{/* Only Rendered Ira doing science is false and Ira has not given main text reply yet */}
							{answerElem.query_id === activeQuery.id &&
								!doingScience &&
								!hasIraGeneratedMainReply && (
									<div className="flex flex-col space-y-3 my-8 ml-12">
										<div className="space-y-3">
											{showFailedResponseBanner ? (
												<div className="flex items-center justify-center p-3 mt-3 ml-12 border border-black/5 shadow-sm w-fit rounded-lg text-sm font-semibold text-primary80">
													<img
														src={failedIcon}
														width={40}
														height={40}
														className="mr-3"
													/>
													Failed to generate a response,
													please refresh the page to try
													again.
												</div>
											) : // show creating observation
											isGraphProcessed ? (
												<div className="darkSoul-glowing-button2">
													<button
														className="darkSoul-button2"
														type="button"
													>
														<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
														Creating Observation...
													</button>
												</div>
											) : (
												<ResponseCard
													answerResp={answerElem}
													isGraphLoading={isGraphLoading}
													setIsGraphLoading={
														setIsGraphLoading
													}
													setShowFailedResponseBanner={
														setShowFailedResponseBanner
													}
													handleNextStep={handleNextStep}
													setAnswerResp={setAnswersList}
													setPromptQuery={setPromptQuery}
													setDoingScience={setDoingScience}
													setResponseTimeElapsed={
														setResponseTimeElapsed
													}
													setShowResponseDelayBanner={
														setShowResponseDelayBanner
													}
													setShowAddToDashboard={
														setShowAddToDashboard
													}
													showTable={
														!answerElem?.answer
															?.response_dataframe &&
														answerElem?.answer?.graph
													}
													setIsTableLoading={
														setIsTableLoading
													}
													isTableLoading={isTableLoading}
												/>
											)}
										</div>
									</div>
								)}
						</div>
					</div>
					<div className="w-full flex flex-col justify-center mx-auto mt-5 pl-12">
						{showResponseDelayBanner && isGettingLateInReply && (
							<div className="flex items-center justify-center p-3 mt-3 border border-black/5 shadow-sm w-fit rounded-lg text-sm font-semibold text-primary80">
								<img
									src={warningIcon}
									width={40}
									height={40}
									className="mr-3"
								/>
								This is taking a bit longer than expected
							</div>
						)}
					</div>
				</div>
			);
		});
	};

	/**
	 * Gives data of current queryId response from state
	 * @param {*} queryId
	 * @returns
	 */
	const getCurrentQueryAns = (queryId) => {
		return answersList.find((item) => item.query_id === queryId);
	};

	return (
		<>
			{completedSteps.includes(4) ? (
				<div className="grid grid-cols-12 gap-4 min-h-[90vh] max-h-[90vh]">
					<div
						className={cn(
							'border rounded-2xl pt-4 px-4 shadow-1xl relative',
							showWorkspace ? 'col-span-8' : 'col-span-12 mx-[8rem]',
						)}
					>
						{renderConversation()}
						<div className="bg-white pt-2">
							<div className="absolute bottom-4 flex flex-col items-center justify-center z-20 bg-white">
								<div className="rounded-[100px] flex justify-between bg-purple-4 px-3 py-2 mb-2 ">
									<Input
										placeholder="Ask IRA"
										className="border-0 outline-none rounded-none bg-transparent w-full"
										value={prompt}
										onChange={(e) => handlePromptChange(e)}
										onKeyDown={(e) => {
											if (e.key === 'Enter')
												handleAppendQuery();
										}}
									/>
									<div
										className="flex gap-2 items-center pr-3 cursor-pointer"
										onClick={handleAppendQuery}
									>
										<img
											src={`https://d2vkmtgu2mxkyq.cloudfront.net/send.svg`}
											className="size-6"
										/>
									</div>
								</div>
								<p className="text-xs text-primary40 font-normal">
									Irame.ai may display inaccurate info, including
									about people, so double-check its responses.
								</p>
							</div>
						</div>
					</div>

					{showWorkspace ? (
						<div className="border rounded-3xl py-4 px-4 col-span-4 shadow-1xl h-[90%]">
							<div className="flex justify-between">
								<div className="flex items-center gap-1">
									<img src="https://d2vkmtgu2mxkyq.cloudfront.net/category.svg" />
									<h3 className="text-primary80 font-semibold text-xl">
										Ira's Workspace
									</h3>
								</div>
								<i
									className="bi-x text-2xl cursor-pointer"
									onClick={() => setShowWorkspace(false)}
								></i>
							</div>

							<Workspace
								handleTabClick={handleTabClick}
								workSpaceTab={workSpaceTab}
								answerResp={getCurrentQueryAns()}
								setWorkSpaceTab={setWorkSpaceTab}
								visitedTabs={visitedTabs}
								setVisitedTabs={setVisitedTabs}
							/>
						</div>
					) : null}
					{showAddToDashboard ? (
						<AddQueryToDashboard
							open={showAddToDashboard}
							setOpen={setShowAddToDashboard}
							setShowCreateDashboard={setShowCreateDashboard}
						/>
					) : null}
					{showCreateDashboard ? (
						<CreateDashboardDialog
							open={showCreateDashboard}
							setOpen={setShowCreateDashboard}
							name={dashboardName}
							setDashboardName={setDashboardName}
							handleCreateNewDashboard={handleCreateNewDashboard}
							errors={errors}
							isLoading={isCreatingDashboard}
						/>
					) : null}
				</div>
			) : (
				<div className="flex justify-center h-md:mt-20">
					<div className="flex flex-col items-center w-[51.875rem] relative">
						<div className="align-left w-full">
							<h1
								className="text-5xl leading-[60px] font-semibold align-left"
								style={gradientText}
							>{`${welcomeTypography?.headingLine1} ${value?.userName}`}</h1>
							<h2 className="text-5xl leading-[60px] font-semibold text-primary20">
								{completedSteps.includes(2) ||
								completedSteps.includes(3)
									? welcomeTypography?.headingLine2_2
									: welcomeTypography?.headingLine2}
							</h2>
							<ul className="relative mt-6 mb-3 inline-flex gap-2">
								{[1, 2, 3]?.map((items, indx) => {
									return (
										<>
											<li
												key={indx}
												className={[
													`h-2 w-14 rounded-3xl `,
													showProgress(items),
												].join(' ')}
												onClick={() => {}}
											></li>
										</>
									);
								})}
							</ul>
						</div>
						<div className="mt-[1rem] h-sm:mt-[2.5rem] overflow-scroll w-full">
							{renderComponent()}
						</div>
						{completedSteps.includes(2) || completedSteps.includes(3) ? (
							<div className="fixed bottom-1 flex flex-col items-center justify-center !w-[51.875rem] max-h-[30rem] overflow-x-auto z-20">
								<div className="rounded-[100px] flex justify-between bg-purple-4 px-3 py-2 mb-2 w-full">
									<Input
										placeholder="Ask IRA"
										className="border-0 outline-none rounded-none bg-transparent w-full mr-2 !h-auto"
										value={prompt}
										onChange={(e) => {
											handlePromptChange(e);
										}}
										onKeyDown={(e) => {
											if (e.key === 'Enter')
												handleQueryAnswer();
										}}
									/>
									<div
										className="flex gap-2 items-center pr-3 cursor-pointer"
										onClick={handleQueryAnswer}
									>
										<img
											src={`https://d2vkmtgu2mxkyq.cloudfront.net/send.svg`}
											className=" size-6"
										/>{' '}
									</div>
								</div>
								<p className="text-xs text-primary40 font-normal">
									Irame.ai may display inaccurate info, including
									about people, so double-check its responses.
								</p>
							</div>
						) : null}
					</div>
				</div>
			)}
		</>
	);
};

export default NewChat;
