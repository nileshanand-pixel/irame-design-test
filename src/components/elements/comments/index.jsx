import CommentTrigger from '@/components/elements/comments/comment-trigger/CommentTrigger';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import CommentHeading from './comment-heading';
import CommentList from './comment-list';
import CommentForm from './comment-form';

export default function Comments({
	withTrigger = false,
	commentsFetcher,
	commetsAdder,
	queryKey,
	onSuccessCommentAddition,
}) {
	const [isCommentSectionVisible, setIsCommentSectionVisible] = useState(
		withTrigger === false,
	);
	const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(true);

	const handleTriggerClick = () => {
		setIsCommentSectionVisible((prev) => !prev);
	};

	const { data, isLoading: isLoadingComments } = useQuery({
		queryKey,
		queryFn: commentsFetcher,
		enabled: isCommentSectionVisible,
	});

	const commentsData = useMemo(() => {
		return data?.comments;
	}, [data]);

	return (
		<div className="relative">
			<div className="absolute top-0 right-0 translate-y-[-120%]">
				{withTrigger && (
					<CommentTrigger
						handleClick={handleTriggerClick}
						commentsData={commentsData}
					/>
				)}
			</div>

			{isCommentSectionVisible && (
				<div className="">
					<CommentHeading
						handleClick={() => setIsCommentSectionOpen((prev) => !prev)}
						isOpen={isCommentSectionOpen}
						commentsData={commentsData}
						isLoadingComments={isLoadingComments}
					/>

					<div className="border border-[#D1D5DB] rounded-lg">
						{isCommentSectionOpen && (
							<CommentList
								commentsData={commentsData}
								isLoadingComments={isLoadingComments}
							/>
						)}

						<CommentForm
							commetsAdder={commetsAdder}
							onSuccessCommentAddition={() => {
								onSuccessCommentAddition();
								setIsCommentSectionOpen(true);
							}}
							isCommentSectionOpen={isCommentSectionOpen}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
