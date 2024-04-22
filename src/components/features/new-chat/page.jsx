import useLocalStorage from '@/hooks/useLocalStorage';
import { welcomeTypography } from './config';
import { useEffect, useState } from 'react';
import ConnectDataSource from './ConnectDataSource';
import SelectPrompt from './SelectPromt';
import InputText from '@/components/elements/InputText';
import AnalysisData from './AnalysisData';
import { useRouter } from '@/hooks/useRouter';
import useGetCookie from '@/hooks/useGetCookie';
import { cn, tokenCookie } from '@/lib/utils';
import ira from '@/assets/icons/ira_icon.svg';
import { Button } from '@/components/ui/button';
import Workspace from './Workspace';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ResponseCard from './ResponseCard';
import {
	createQuerySession,
	getQueryAnswers,
	getUserDetails,
} from './service/new-chat.service';

const NewChat = () => {
	const [value, updateValue] = useLocalStorage('userDetails');
	const [answerConfig, setAnswerConfig] = useLocalStorage('answerRespConfig');
	const [dataSource] = useLocalStorage('dataSource');
	const [promptQuery] = useLocalStorage('prompt');

	const { query, params, navigate } = useRouter();
	const token = useGetCookie('token');

	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState(0);
	const [showRenameDialog, setShowRenameDialog] = useState(false);
	const [completedSteps, setCompletedSteps] = useState([1]);
	const [prompt, setPrompt] = useState('');
	const [showWorkspace, setShowWorkspace] = useState(true);
	const [workSpaceTab, setWorkSpaceTab] = useState('');
	const [doingScience, setDoingScience] = useState(true);
	const [answerResp, setAnswerResp] = useState({});

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
				// if (
				//   itemCurrent?.key === step ||
				//   itemCurrent?.myStep === formProgressAndComponentMapping[step]
				// ) {
				//   tempCssClass += `bg-purple-16 cursor-pointer`;
				// } else if (itemCurrent?.myStep <= isStepCompleted?.current) {
				//   tempCssClass += `bg-purple-100 cursor-pointer`;
				// } else {
				//   tempCssClass += `bg-blue-16`;
				// }
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
					/>
				);
			default:
				return <div>Chat / Converse</div>;
		}
	};

	const handleTabClick = (tab) => {
		setWorkSpaceTab(tab);
	};
	const handleQueryAnswer = () => {
		handleNextStep(4);
		createQuerySession(query.dataSourceId, prompt, token || tokenCookie).then(
			(res) => {
				navigate(
					`/app/new-chat/?step=4&dataSourceId=${query.dataSourceId}&sessionId=${res.session_id}&queryId=${res.query_id}`,
				);
			},
		);
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				if (value.userName && value.email) return;
				const userData = await getUserDetails(token || tokenCookie);
				console.log('userData', {
					token: token,
					userName: userData?.name,
					email: userData?.email,
					avatar: userData?.avatar,
					userId: userData?._id,
				});

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
		let intervalId;
		if (query?.step) {
			setCompletedSteps((prev) => [...prev, parseInt(query?.step)]);

			if (query?.step === '3') {
				setCompletedSteps([1, 3]);
			}

			if (query?.step === '4') {
				setPrompt('');
				let timer = 10000;
				intervalId = setInterval(() => {
					getQueryAnswers(query?.queryId, token || tokenCookie).then(
						(res) => {
							setAnswerResp(res);

							if (res?.answer) {
								setAnswerConfig(res?.answer);
							}

							if (res.status === 'in_progress') {
								timer = 5000;
								setDoingScience(false);
							}
						},
					);
				}, timer);
			}
		} else {
			setCompletedSteps([1]);
		}

		return () => {
			clearInterval(intervalId);
		};
	}, [query?.step, token, tokenCookie]);

	return (
		<>
			{completedSteps.includes(4) ? (
				<div className="grid grid-cols-12 gap-4 h-[90vh]">
					<div
						className={cn(
							'border rounded-2xl py-4 px-4 shadow-1xl relative',
							showWorkspace ? 'col-span-8' : 'col-span-12 mx-[8rem]',
						)}
					>
						<div className="mt-2 mb-8 rounded-lg px-5 py-2 bg-purple-4 float-right text-primary80 font-medium">
							<i className="bi-database-check mr-2 text-primary80"></i>
							{dataSource.name}
						</div>
						<div className="max-h-[45rem] overflow-y-auto mt-14">
							<div className="flex items-center gap-2">
								<Avatar className="size-9">
									<AvatarImage src={value?.avatar} />
									<AvatarFallback>CN</AvatarFallback>
								</Avatar>
								{promptQuery?.data ? (
									<p className="ms-1">{promptQuery?.data}</p>
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
									className="text-sm font-semibold text-purple-100 hover:bg-white hover:text-purple-100 hover:opacity-80"
									onClick={() => setShowWorkspace(!showWorkspace)}
								>
									{showWorkspace ? 'Hide' : 'Show'} Workspace
								</Button>
							</div>
							{doingScience ? (
								<div className="flex flex-col space-y-3 mt-4 ml-12">
									<div className="space-y-2">
										<Skeleton className="h-5 w-[80%] bg-purple-8" />
										<Skeleton className="h-5 w-[50%] bg-purple-8" />
										<Skeleton className="h-5 w-[65%] bg-purple-8" />
									</div>
									<Skeleton className="h-[125px] w-[250px] rounded-xl bg-purple-8" />
								</div>
							) : (
								<ResponseCard answerResp={answerResp} />
							)}
						</div>
						<div className="absolute bottom-5 flex flex-col items-center justify-center z-20 bg-white pt-2">
							<div className="rounded-[100px] flex justify-between bg-purple-4 px-3 py-2 mb-2 ">
								<InputText
									placeholder="Enter a prompt here"
									inputMainClass={cn(
										'border-0 outline-none rounded-none bg-transparent ',
										showWorkspace ? 'w-[44.2rem]' : 'w-[53rem]',
									)}
									value={prompt}
									setValue={(e) => setPrompt(e)}
									onkeyDown={(e) => {
										if (e.key === 'Enter') handleQueryAnswer();
									}}
								/>
								<div className="flex gap-2 items-center pr-3 cursor-pointer">
									<i className="bi-send text-primary100 text-lg rotate-45"></i>
								</div>
							</div>
							<p className="text-xs text-primary40 font-normal">
								Irame.ai may display inaccurate info, including about
								people, so double-check its responses.
							</p>
						</div>
					</div>
					{showWorkspace ? (
						<div className="border rounded-3xl py-4 px-4 col-span-4 shadow-1xl h-fit">
							<div className="flex justify-between">
								<h3 className="text-primary80 font-semibold text-xl">
									Ira's Workspace
								</h3>
								<i
									className="bi-x text-2xl cursor-pointer"
									onClick={() => setShowWorkspace(false)}
								></i>
							</div>

							<Workspace
								handleTabClick={handleTabClick}
								workSpaceTab={workSpaceTab}
								answerResp={answerResp}
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
									<InputText
										placeholder="Enter a prompt here"
										inputMainClass="border-0 outline-none rounded-none bg-transparent !w-[46rem] !h-auto"
										value={prompt}
										setValue={(e) => setPrompt(e)}
										onkeyDown={(e) => {
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
