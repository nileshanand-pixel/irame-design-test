import useLocalStorage from '@/hooks/useLocalStorage';
import { welcomeTypography } from './config';
import { useEffect, useRef, useState } from 'react';
import ConnectDataSource from './ConnectDataSource';
import SelectPrompt from './SelectPromt';
import AnalysisData from './AnalysisData';
import { useRouter } from '@/hooks/useRouter';
import { createQuerySession } from './service/new-chat.service';
import { useSelector, useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { useQueryClient } from '@tanstack/react-query';
// import InputArea from './InputArea';
import { trackEvent } from '@/lib/mixpanel';
import { logError } from '@/lib/logger';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { toast } from '@/lib/toast';
import { queryClient } from '@/lib/react-query';
import { useDatasourceId } from '@/hooks/use-datasource-id';
import InputArea from './components/input-area/input-area';
import StepThreeContent from './components/step-three-content';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';
import { REDIRECTION_URL_AFTER_LOGIN } from '@/constants/login-constants';

const NewChat = () => {
	const [value, updateValue] = useLocalStorage('userDetails');
	const [dataSource] = useLocalStorage('dataSource');
	const datasourceId = useDatasourceId();

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
	const preChatScreenLoadedRef = useRef(false);

	const { data: datasourceData } = useDatasourceDetailsV2();
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
			logError(error, { feature: 'chat', action: 'show-progress' });
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
					<StepThreeContent
						setPrompt={setPrompt}
						dataSources={datasourceData ? [datasourceData] : []}
					/>
				);
			default:
				return <div>Chat / Converse</div>;
		}
	};

	useEffect(() => {
		if (!datasourceId || !query?.step || query.step !== '3') {
			navigate('/home');
		}
	}, [datasourceId, query]);

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
				datasource_id: query.datasource_id,
				type: mode,
			};

			if (mode === 'single' && prompt) payload.query = prompt;
			if (mode !== 'single' && metadata) payload.metadata = metadata;

			dispatch(
				updateChatStoreProp([
					{ key: 'queries', value: [{ id: '', question: prompt }] },
					{ key: 'refreshChat', value: !chatStoreReducer?.refreshChat },
				]),
			);
			createQuerySession(payload)
				.then((res) => {
					navigate(
						`/app/new-chat/session?sessionId=${res?.session_id}&source=pre_chat_screen&datasource_id=${query.datasource_id}`,
					);
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
						]),
					);
					trackEvent(
						EVENTS_ENUM.CHAT_SESSION_STARTED,
						EVENTS_REGISTRY.CHAT_SESSION_STARTED,
						() => ({
							dataset_id: query.datasource_id,
							dataset_name: datasourceData?.name,
							start_method: 'manual_input',
							chat_session_id: res?.session_id,
							chat_session_type: 'new',
						}),
					);
					trackEvent(
						EVENTS_ENUM.CHAT_MESSAGE_SENT,
						EVENTS_REGISTRY.CHAT_MESSAGE_SENT,
						() => ({
							chat_session_id: res?.session_id,
							query_id: res?.query_id,
							dataset_id: query.datasource_id,
							dataset_name: datasourceData?.name,
							message_type: 'user',
							message_source: 'manual_input',
							message_text: prompt,
							is_clarification: false,
							message_number: 1,
							first_message_in_chat: true,
						}),
					);
					queryClient.invalidateQueries({ queryKey: ['chat-history'] });
				})
				.catch((error) => {
					logError(error, { feature: 'chat', action: 'create-session' });
					navigate(REDIRECTION_URL_AFTER_LOGIN);
					toast.error('Error Creating Session, Please Try Again');
				});
		} catch (error) {
			console.log(error);
			logError(error, { feature: 'chat', action: 'create-session' });
		}
	};

	const queryClientInstance = useQueryClient();

	const findDataSourceById = (dataSourceId) => {
		const cached = queryClientInstance.getQueryData([
			'data-source-details-v2',
			dataSourceId,
		]);
		return cached || null;
	};

	const getChatHistoryDataSourceName = (dataSourceId) => {
		const dataSource = findDataSourceById(dataSourceId);
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
		if (datasourceData) {
			const { dataSourceId, source } = query;
			if (!preChatScreenLoadedRef.current) {
				trackEvent(
					EVENTS_ENUM.PRE_CHAT_SCREEN_LOADED,
					EVENTS_REGISTRY.PRE_CHAT_SCREEN_LOADED,
					() => ({
						dataset_id: dataSourceId,
						dataset_name: datasourceData?.name,
						source: source || 'url',
					}),
				);
				preChatScreenLoadedRef.current = true;
			}
		}
	}, [datasourceData, query]);

	useEffect(() => {
		const { step, datasource_id } = query;

		if (!step || !datasource_id) {
			trackEvent(
				EVENTS_ENUM.LANDING_PAGE_LOADED,
				EVENTS_REGISTRY.LANDING_PAGE_LOADED,
			);
		}
	}, [query]);

	useEffect(() => {
		let intervalId;
		if (query?.step) {
			setCompletedSteps((prev) => [...prev, parseInt(query.step)]);

			if (query.step === '3') {
				setCompletedSteps([1, 2, 3]);
			}
		} else {
			setCompletedSteps([1]);
		}

		return () => {
			clearInterval(intervalId);
		};
	}, [query?.step, query?.queryId, dispatch, utilReducer?.promptQuery]);

	useEffect(() => {
		setIsGraphLoading(true);
		setDoingScience(true);
	}, [
		query.datasource_id,
		query.sessionId,
		query.queryId,
		utilReducer?.answerFromHistory,
	]);

	useEffect(() => {
		if (utilReducer?.resetChat) {
			setDoingScience(true);
		}
	}, [utilReducer?.dataSources, utilReducer?.resetChat]);

	return (
		<div className="flex flex-col relative w-[70%] pt-10">
			<div className="">
				<h1 className="text-3xl font-semibold" style={gradientText}>
					{`${welcomeTypography?.headingLine1} ${value?.user_name}`}
				</h1>
				<h2 className="text-5xl leading-[3.75rem] font-semibold text-primary20">
					{completedSteps.includes(2) || completedSteps.includes(3)
						? welcomeTypography?.headingLine2_2
						: welcomeTypography?.headingLine2}
				</h2>
				<ul className="relative mt-4 mb-3 inline-flex gap-2">
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
			<div className="mt-[1rem] overflow-auto w-full">{renderComponent()}</div>
			{completedSteps.includes(2) || completedSteps.includes(3) ? (
				<div className="mt-auto w-full flex flex-col items-center justify-center z-20">
					<InputArea
						config={config}
						onAppendQuery={handleCreateSession}
						promptInitialValue={prompt}
					/>
					<p className="text-xs text-primary40 font-normal">
						Irame.ai may display inaccurate info, including about people,
						so double-check its responses.
					</p>
				</div>
			) : null}
		</div>
	);
};

export default NewChat;
