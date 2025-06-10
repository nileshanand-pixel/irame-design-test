import useLocalStorage from '@/hooks/useLocalStorage';
import { welcomeTypography } from './config';
import { useEffect, useState } from 'react';
import ConnectDataSource from './ConnectDataSource';
import SelectPrompt from './SelectPromt';
import AnalysisData from './AnalysisData';
import { useRouter } from '@/hooks/useRouter';
import { getToken } from '@/lib/utils';
import { createQuerySession, getUserSession } from './service/new-chat.service';
import { useSelector, useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { getDataSources } from '../configuration/service/configuration.service';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { useQuery } from '@tanstack/react-query';
import { updateAuthStoreProp } from '@/redux/reducer/authReducer';
import InputArea from './InputArea';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { toast } from 'sonner';
import { queryClient } from '@/lib/react-query';

const NewChat = () => {
	const [value, updateValue] = useLocalStorage('userDetails');
	const [dataSource] = useLocalStorage('dataSource');

	const { query, params, navigate, pathname } = useRouter();

	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const authStoreReducer = useSelector((state) => state.authStoreReducer);
	const dispatch = useDispatch();

	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState(0);
	const [showRenameDialog, setShowRenameDialog] = useState(false);
	const [completedSteps, setCompletedSteps] = useState([1]);
	const [prompt, setPrompt] = useState('');
	const [doingScience, setDoingScience] = useState(true);
	const [answersList, setAnswersList] = useState([]);
	const [promptQuery, setPromptQuery] = useState({ data: '' });
	const [isGraphLoading, setIsGraphLoading] = useState(true);
	const [errors, setErrors] = useState({});

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
				return <SelectPrompt setPrompt={setPrompt} />;
			default:
				return <div>Chat / Converse</div>;
		}
	};

	const handleCreateSession = (
		prompt,
		queries,
		savedQueryReference,
		mode = 'single',
	) => {
		try {
			if (mode === 'single' && (!prompt || !prompt?.trim())) return;
			let metadata;
			if (queries && queries?.length > 0) {
				metadata = {
					queries: queries
						.filter((query) => query?.text?.length > 0)
						.map((item) => ({ query: item?.text })),
					saved_query_reference: savedQueryReference,
				};
			}
			const payload = {
				datasource_id: query.dataSourceId,
				type: mode,
			};

			if (mode === 'single' && prompt) payload.query = prompt;
			if (mode !== 'single' && metadata) payload.metadata = metadata;

			navigate(`/app/new-chat/session`);
			dispatch(
				updateChatStoreProp([
					{ key: 'queries', value: [{ id: '', question: prompt }] },
					{ key: 'refreshChat', value: !chatStoreReducer?.refreshChat },
				]),
			);
			createQuerySession(payload, getToken())
				.then((res) => {
					dispatch(
						updateChatStoreProp([
							{
								key: 'queries',
								value: [
									{
										id: res?.query_id || '',
										question: res?.query || prompt,
										metadata: res?.query?.metadata,
										type: res?.type,
									},
								],
							},
							{
								key: 'activeChatSession',
								value: {
									id: res?.session_id,
									title: res?.query || '',
									mode: res?.type,
								},
							},
							{ key: 'activeQueryId', value: res?.query_id },
						]),
					);
					trackEvent(
						EVENTS_ENUM.QUERY_INITIATED,
						EVENTS_REGISTRY.QUERY_INITIATED,
						() => ({
							query_id: res?.query_id,
							datasource_id: query.dataSourceId,
						}),
					);
					queryClient.invalidateQueries(['chat-history']);
				})
				.catch((error) => {
					navigate('/app/new-chat');
					toast.error('Error Creating Session, Please Try Again');
				});
		} catch (error) {
			console.log(error);
		}
	};

	const fetchUserSession = () => {
		try {
			// if (utilReducer?.sessionHistory?.length > 0) return;
			getUserSession(getToken()).then((res) => {
				dispatch(updateUtilProp([{ key: 'sessionHistory', value: res }]));
				if (!authStoreReducer?.user_id)
					dispatch(
						updateAuthStoreProp([
							{ key: 'user_id', value: res?.[0]?.user_id },
						]),
					);
			});
		} catch (error) {
			console.error('Error fetching user session:', error);
		}
	};

	const {
		data: dataSources,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['data-sources'],
		queryFn: () => getDataSources(getToken()),
		onSuccess: (data) => {
			dispatch(updateUtilProp([{ key: 'dataSources', value: data }]));
		},
	});

	const getChatHistoryDataSourceName = (dataSourceId) => {
		const datasets = dataSources || utilReducer?.dataSources;
		const dataSource = datasets?.find(
			(source) => source.datasource_id === dataSourceId,
		);
		return { id: dataSourceId, name: dataSource?.name };
	};

	const config = {
		queryInBulk: { enabled: false },
		workflowQuery: { enabled: true },
		createReport: { enabled: false },
		createDashboard: { enabled: false },
		savedQueries: { enabled: true },
	};

	useEffect(() => {
		trackEvent(
			EVENTS_ENUM.LANDING_PAGE_LOADED,
			EVENTS_REGISTRY.LANDING_PAGE_LOADED,
		);
		fetchUserSession();
	}, []);

	useEffect(() => {
		let intervalId;
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
		utilReducer?.promptQuery,
	]);

	useEffect(() => {
		setIsGraphLoading(true);
		setDoingScience(true);
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
					{
						key: 'selectedDataSource',
						value: { id: query.dataSourceId, value: dataSource?.name },
					},
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
			{
				<div className="flex justify-center pt-5 xl:pt-10">
					<div className="flex flex-col w-[51.875rem] relative">
						<div className="align-left w-full">
							<h1
								className="text-2xl lg:text-3xl leading-[24px] lg:leading-[36px] font-semibold align-left"
								style={gradientText}
							>{`${welcomeTypography?.headingLine1} ${value?.user_name}`}</h1>
							<h2 className="text-5xl leading-[60px] font-semibold text-primary20">
								{completedSteps.includes(2) ||
								completedSteps.includes(3)
									? welcomeTypography?.headingLine2_2
									: welcomeTypography?.headingLine2}
							</h2>
							<ul className="relative mt-2 xl:mt-4 mb-3 inline-flex gap-2">
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
						<div className="mt-[1rem]  overflow-auto w-full">
							{renderComponent()}
						</div>
						{completedSteps.includes(2) || completedSteps.includes(3) ? (
							<div className="fixed bottom-1 flex flex-col items-center justify-center !w-[51.875rem] max-h-[30rem] overflow-x-scroll z-20">
								<InputArea
									config={config}
									onAppendQuery={handleCreateSession}
								/>
								<p className="text-xs text-primary40 font-normal">
									Irame.ai may display inaccurate info, including
									about people, so double-check its responses.
								</p>
							</div>
						) : null}
					</div>
				</div>
			}
		</>
	);
};

export default NewChat;
