/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import {
	createQuerySession,
	fetchSuggestions,
	getAnswerConfig,
} from './service/new-chat.service';
import { useRouter } from '@/hooks/useRouter';
import useGetCookie from '@/hooks/useGetCookie';
import { tokenCookie } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import useLocalStorage from '@/hooks/useLocalStorage';

const SelectPrompt = ({
	handleNextStep,
	prompt,
	setPrompt,
	answerResp,
	setAnswerResp,
}) => {
	const [activeTab, setActiveTab] = useState('');
	const [data, setData] = useState([]);
	const { query, navigate } = useRouter();
	const token = useGetCookie('token');
	const [answerConfig, setAnswerConfig] = useLocalStorage('answerRespConfig');
	const [promptQuery, setPromptQuery] = useLocalStorage('query');

	const handleActiveTab = (selectedTab) => {
		setActiveTab(selectedTab);
	};
	const handlePrompt = (question) => {
		try {
			// setPrompt(question);
			setPromptQuery({ data: question });
			handleNextStep(4);
			createQuerySession(
				query.dataSourceId,
				question,
				token || tokenCookie,
			).then((res) => {
				navigate(
					`/app/new-chat/?step=4&dataSourceId=${query.dataSourceId}&sessionId=${res.session_id}&queryId=${res.query_id}`,
				);
			});
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		if (query.dataSourceId) {
			fetchSuggestions(query.dataSourceId, token || tokenCookie).then(
				(resp) => {
					console.log(resp);
					setData(resp);
					setActiveTab(resp?.suggestion[0]?.type);
				},
			);
		}
	}, [query.dataSourceId]);

	useEffect(() => {
		// getAnswerConfig(token || tokenCookie).then((res) => {
		// 	setAnswerResp(res);
		// 	setAnswerConfig(res);
		// });
	}, []);

	return (
		<div className="">
			<div className="mt-8">
				<div className="w-full overflow-x-auto flex gap-4">
					<ul className="flex gap-2 items-center w-full">
						{data?.suggestion?.length > 0 ? (
							data?.suggestion?.map((suggestion, index) => (
								<li
									key={suggestion?.suggestion_id}
									className={`${
										suggestion?.type === activeTab
											? ' text-purple-100 border-purple-40 tabActiveBg'
											: 'text-black/60 border-black/10'
									} text-sm font-medium border rounded-3xl px-3 py-2 cursor-pointer min-w-fit max-w-[19.25rem]`}
									onClick={() => handleActiveTab(suggestion?.type)}
								>
									<div className="min-w-fit">
										{suggestion?.type}
									</div>
								</li>
							))
						) : (
							<div className="flex space-x-2">
								{[...Array(4)].map((_, index) => (
									<Skeleton
										key={index}
										className="h-8 w-[150px] bg-purple-4 rounded-2xl"
									/>
								))}
							</div>
						)}
					</ul>
				</div>
				{activeTab ? (
					<div className="w-full overflow-x-auto flex gap-4 mt-8">
						{data?.suggestion?.length > 0
							? data.suggestion
									.find(
										(suggestion) =>
											suggestion.type === activeTab,
									)
									.questions.map((question, index) => (
										<div
											className="relative bg-purple-4 rounded-xl min-w-[15rem] max-w-[19.25rem] max-h-[21.75rem] p-4 hover:bg-purple-8 mb-3"
											key={`${index}_question`}
										>
											<div
												className="overflow-y-auto text-base font-medium text-primary80"
												onClick={() =>
													handlePrompt(question)
												}
											>
												<ul className="divide-y-[24px] divide-transparent line-clamp-3">
													<li className="flex items-center gap-2 hover:cursor-pointer hover:text-purple-80">
														{question}
													</li>
												</ul>
											</div>
											<div
												className="absolute bottom-4 right-4 text-right mt-6 cursor-pointer"
												onClick={() => setPrompt(question)}
											>
												<i className="bi-pencil-square text-primary100 bg-white py-1.5 px-2 rounded-full "></i>
											</div>
										</div>
									))
							: [...Array(5)].map((_, index) => (
									<div className="flex space-x-2" key={index}>
										<Skeleton className="h-[125px] w-[250px] rounded-xl bg-purple-4" />
									</div>
							  ))}
					</div>
				) : (
					<div className="flex space-x-2 mt-4">
						{[...Array(4)].map((_, index) => (
							<Skeleton
								className="h-[125px] w-[250px] rounded-xl bg-purple-4"
								key={index}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default SelectPrompt;
