import { Plus } from '@phosphor-icons/react';
import UserProfileIcon from '../../user-profile-icon';

export default function CommentTrigger({ handleClick, commentsData }) {
	const isCommentPresent = commentsData && commentsData.length !== 0;
	const firstComment = commentsData && commentsData[0];

	return (
		<div
			onClick={handleClick}
			className="p-2 inline-flex items-center justify-center border border-[#D1D5DB] rounded-full rounded-bl-none cursor-pointer bg-[#fff]"
		>
			{isCommentPresent ? (
				<div className="flex gap-[0.125rem] items-center">
					<UserProfileIcon
						userName={firstComment?.user}
						userEmail={firstComment?.email}
					/>
					<span className="text-[0.625rem] font-semibold">
						{commentsData.length}+
					</span>
				</div>
			) : (
				<div className="text-[#333333] font-semibold ">
					<Plus color="#333333" weight="bold" className="size-3" />
				</div>
			)}
		</div>
	);
}
