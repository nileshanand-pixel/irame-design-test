import useLocalStorage from '@/hooks/useLocalStorage';
import { welcomeTypography } from './config';
import { useEffect, useState } from 'react';
import ConnectDataSource from './ConnectDataSource';
import SelectPrompt from './SelectPromt';
import InputText from '@/components/elements/InputText';
import AnalysisData from './AnalysisData';
import { useRouter } from '@/hooks/useRouter';
import useGetCookie from '@/hooks/useGetCookie';
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

const NewChat = () => {
	const [value, updateValue] = useLocalStorage('userDetails');
	const [answerConfig, setAnswerConfig] = useLocalStorage('answerRespConfig');
	const [dataSource] = useLocalStorage('dataSource');
	// const [promptQuery, setPromptQuery] = useLocalStorage('questionPrompt');
	const [searchParam, setSearchParam] = useSearchParams();

	const { query, params, navigate } = useRouter();
	const token = useGetCookie('token');

	const utilReducer = useSelector((state) => state.utilReducer);
	const dispatch = useDispatch();

	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState(0);
	const [showRenameDialog, setShowRenameDialog] = useState(false);
	const [completedSteps, setCompletedSteps] = useState([1]);
	const [prompt, setPrompt] = useState('');
	const [showWorkspace, setShowWorkspace] = useState(true);
	const [workSpaceTab, setWorkSpaceTab] = useState('');
	const [doingScience, setDoingScience] = useState(true);
	const [answerResp, setAnswerResp] = useState({});
	const [promptQuery, setPromptQuery] = useState({ data: '' });
	const [showResponseDelayBanner, setShowResponseDelayBanner] = useState(false);
	const [showFailedResponseBanner, setShowFailedResponseBanner] = useState(false);
	const [responseTimeElapsed, setResponseTimeElapsed] = useState(0);
	const [isGraphLoading, setIsGraphLoading] = useState(true);
	const [visitedTabs, setVisitedTabs] = useState({});

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
						prompt={prompt}
						setAnswerResp={setAnswerResp}
						answerResp={answerResp}
						setPromptQuery={setPromptQuery}
						promptQuery={promptQuery}
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
	const handleQueryAnswer = () => {
		handleNextStep(4);
		setDoingScience(true);
		if (searchParam.has('sessionId') || searchParam.has('queryId')) {
			const newParams = new URLSearchParams(location.search);
			newParams.delete('sessionId');
			newParams.delete('queryId');
			setSearchParam(newParams.toString());
			setAnswerResp({});
		}
		createQuerySession(query.dataSourceId, prompt, getToken()).then((res) => {
			navigate(
				`/app/new-chat/?step=4&dataSourceId=${query.dataSourceId}&sessionId=${res.session_id}&queryId=${res.query_id}`,
			);
		});
	};

	const getInputWidth = () => {
		if (utilReducer?.isSideNavOpen) {
			return showWorkspace ? 'w-[44.2rem]' : 'w-[53rem]';
		} else {
			return showWorkspace ? 'w-[51.5rem]' : 'w-[64.5rem]';
		}
	};

	const resetStates = () => {};
	const fetchUserSession = () => {
		try {
			// if (utilReducer?.sessionHistory?.length > 0) return;
			getUserSession(getToken()).then((res) => {
				dispatch(updateUtilProp([{ key: 'sessionHistory', value: res }]));
			});
		} catch (error) {
			console.error('Error fetching user session:', error);
		}
	};

	const getChatHistoryDataSourceName = (dataSourceId) => {
		if (!utilReducer?.dataSources || utilReducer?.dataSources?.length <= 0) {
			getDataSources(getToken()).then((res) => {
				dispatch(updateUtilProp([{ key: 'dataSources', value: res }]));

				const dataSource = res.find(
					(source) => source.datasource_id === dataSourceId,
				);
				return dataSource?.name;
			});
		}
		const dataSource = utilReducer?.dataSources.find(
			(source) => source.datasource_id === dataSourceId,
		);
		return dataSource?.name;
	};

	const handlePromptChange = (e) => {
		try {
			const { value } = e.target;
			console.log('prompt:', value);
			setPrompt(value);
			dispatch(
				updateUtilProp([
					{
						key: 'queryPrompt',
						value: prompt,
					},
				]),
			);
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				if (value.userName && value.email && value.avatar) return;
				const userData = await getUserDetails(getToken());

				// Update local state with user details
				updateValue({
					token: token,
					userName: userData?.name,
					email: userData?.email,
					avatar: userData?.avatar,
				});
			} catch (error) {
				console.error('Error fetching user details:', error);
			}
		};

		fetchData();
		fetchUserSession();

		setAnswerResp({
			...answerConfig,
		});
		for (const key in answerConfig) {
			if (answerConfig[key].tool_space === 'secondary') {
				setWorkSpaceTab(key);
				break;
			}
		}
	}, []);

	useEffect(() => {
		if (!promptQuery.data) {
			setPromptQuery({ data: utilReducer?.promptQuery });
		}
	}, [utilReducer?.promptQuery]);

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

			if (query.step === '4') {
				setPrompt('');
				let timer = 5000;
				intervalId = setInterval(() => {
					getQueryAnswers(query.queryId, getToken())
						.then((res) => {
							setAnswerResp(res);

							if (res?.answer) {
								setAnswerConfig(res.answer);
							}
							if (
								!promptQuery.data ||
								utilReducer?.promptQuery !== res.query
							) {
								setPromptQuery({ data: res.query });
								dispatch(
									updateUtilProp([
										{ key: 'queryPrompt', value: res.query },
									]),
								);
							}

							if (
								res.status === 'in_progress' ||
								res.status === 'done'
							) {
								timer = 5000;
								setDoingScience(false);
								dispatch(
									updateUtilProp([
										{ key: 'resetChat', value: false },
									]),
								);
							}
							if (res.status === 'done') {
								if (!res.answer?.graph && !res.answer?.answer) {
									setShowFailedResponseBanner(true);
									setDoingScience(false);
									setIsGraphLoading(false);
								}
								clearInterval(intervalId);
							}
						})
						.catch((error) => {
							console.error('Error fetching query answers:', error);
							setShowFailedResponseBanner(true);
							setDoingScience(false);
							setIsGraphLoading(false);
							setShowResponseDelayBanner(false); // Reset delay banner when failed response banner is shown
							clearInterval(intervalId);
						});

					setResponseTimeElapsed((prev) => {
						const newElapsedTime = prev + 5;
						handleResponseDelay(newElapsedTime);
						return newElapsedTime;
					});
				}, timer);
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
		setAnswerResp({});
		setShowResponseDelayBanner(false);
		setShowFailedResponseBanner(false);
		setResponseTimeElapsed(0);
		setPromptQuery({ data: utilReducer?.queryPrompt });
	}, [query.dataSourceId, query.sessionId, query.queryId]);

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
						{utilReducer?.selectedDataSource && (
							<div className="mt-2 mb-8 rounded-lg px-5 py-2 bg-purple-4 float-right text-primary80 font-medium max-w-[220px] truncate">
								<i className="bi-database-check mr-2 text-primary80"></i>
								{utilReducer?.selectedDataSource}
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
								{promptQuery.data ? (
									<p className="ms-1 bg-purple-4 text-primary80 font-normal px-4 py-2 rounded-tl-[6px] rounded-tr-[80px] rounded-br-[80px] rounded-bl-[80px]">
										{promptQuery.data}
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
									<span className="material-symbols-outlined me-1">
										category
									</span>
									{showWorkspace ? 'Hide' : 'Show'} Workspace
								</Button>
							</div>
							<div className="mt-8">
								{doingScience || !answerResp?.answer?.graph ? (
									showFailedResponseBanner ? (
										<div className="flex items-center justify-center p-3 mt-3 ml-12 border border-black/5 shadow-sm w-fit rounded-lg text-sm font-semibold text-primary80">
											<img
												src={failedIcon}
												width={40}
												height={40}
												className="mr-3"
											/>
											Failed to generate a response, please
											refresh the page to try again.
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
										answerResp={answerResp}
										isGraphLoading={isGraphLoading}
										setIsGraphLoading={setIsGraphLoading}
										setShowFailedResponseBanner={
											setShowFailedResponseBanner
										}
										handleNextStep={handleNextStep}
										setAnswerResp={setAnswerResp}
										setPromptQuery={setPromptQuery}
										setDoingScience={setDoingScience}
										setResponseTimeElapsed={
											setResponseTimeElapsed
										}
										setShowResponseDelayBanner={
											setShowResponseDelayBanner
										}
										doingScience={doingScience}
									/>
								)}

								{doingScience ||
									(!answerResp?.answer?.answer && (
										<div className="flex flex-col space-y-3 mt-8 ml-12">
											<div className="space-y-3">
												{answerResp?.answer?.graph ? (
													showFailedResponseBanner ? (
														<div className="flex items-center justify-center p-3 mt-3 ml-12 border border-black/5 shadow-sm w-fit rounded-lg text-sm font-semibold text-primary80">
															<img
																src={failedIcon}
																width={40}
																height={40}
																className="mr-3"
															/>
															Failed to generate a
															response, please refresh
															the page to try again.
														</div>
													) : (
														<div className="darkSoul-glowing-button2 ml-12">
															<button
																className="darkSoul-button2"
																type="button"
															>
																<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
																Creating
																Observation...
															</button>
														</div>
													)
												) : (
													<ResponseCard
														answerResp={answerResp}
														isGraphLoading={
															isGraphLoading
														}
														setIsGraphLoading={
															setIsGraphLoading
														}
														setShowFailedResponseBanner={
															setShowFailedResponseBanner
														}
														handleNextStep={
															handleNextStep
														}
														setAnswerResp={setAnswerResp}
														setPromptQuery={
															setPromptQuery
														}
														setDoingScience={
															setDoingScience
														}
														setResponseTimeElapsed={
															setResponseTimeElapsed
														}
														setShowResponseDelayBanner={
															setShowResponseDelayBanner
														}
													/>
												)}
											</div>
										</div>
									))}
							</div>
						</div>
						<div className="w-full flex flex-col justify-center mx-auto mt-5 pl-12">
							{showResponseDelayBanner &&
								(!answerResp?.answer?.graph ||
									!answerResp?.answer?.answer) && (
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
							{/* {showFailedResponseBanner &&
								(!answerResp?.answer?.graph ||
									!answerResp?.answer?.answer) && (
									<div className="flex items-center justify-center p-3 mt-3 border border-black/5 shadow-sm w-fit rounded-lg text-sm font-semibold text-primary80">
										<img
											src={failedIcon}
											width={40}
											height={40}
											className="mr-3"
										/>
										Failed to generate a response, please refresh
										the page to try again.
									</div>
								)} */}
						</div>

						<div className="bg-white pt-2">
							<div className="absolute bottom-4 flex flex-col items-center justify-center z-20 ">
								<div className="rounded-[100px] flex justify-between bg-purple-4 px-3 py-2 mb-2 ">
									<Input
										placeholder="Enter a prompt here"
										className={cn(
											'border-0 outline-none rounded-none bg-transparent ',
											getInputWidth(),
										)}
										value={prompt}
										onChange={(e) => handlePromptChange(e)}
										onKeyDown={(e) => {
											if (e.key === 'Enter')
												handleQueryAnswer();
										}}
									/>
									<div
										className="flex gap-2 items-center pr-3 cursor-pointer"
										onClick={handleQueryAnswer}
									>
										<i className="bi-send text-primary100 text-lg rotate-45"></i>
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
						<div className="border rounded-3xl py-4 px-4 col-span-4 shadow-1xl h-fit">
							<div className="flex justify-between">
								<div className="flex items-center gap-1">
									<span className="material-symbols-outlined me-1">
										category
									</span>
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
								answerResp={answerResp}
								setWorkSpaceTab={setWorkSpaceTab}
								visitedTabs={visitedTabs}
								setVisitedTabs={setVisitedTabs}
							/>
						</div>
					) : null}
				</div>
			) : (
				<div className="flex justify-center pt-8">
					<div className="flex flex-col items-center w-[51.875rem] relative">
						<div className="align-left w-full">
							<h1
								className="text-5xl leading-[60px] font-semibold align-left"
								style={gradientText}
							>{`${welcomeTypography?.headingLine1} ${value.userName}`}</h1>
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
						<div className="mt-[2.5rem] overflow-scroll w-full">
							{renderComponent()}
						</div>
						{completedSteps.includes(2) || completedSteps.includes(3) ? (
							<div className="fixed bottom-1 flex flex-col items-center justify-center !w-[51.875rem] max-h-[30rem] overflow-x-auto z-20">
								<div className="rounded-[100px] flex justify-between bg-purple-4 px-3 py-2 mb-2 w-full">
									<Input
										placeholder="Enter a prompt here"
										className="border-0 outline-none rounded-none bg-transparent !w-[46rem] !h-auto"
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
										<i className="bi-send text-primary100 text-lg rotate-45"></i>
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
