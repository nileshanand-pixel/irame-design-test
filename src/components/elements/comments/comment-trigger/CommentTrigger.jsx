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
				<div className="flex gap-[2px] items-center">
					<UserProfileIcon
						userName={firstComment?.user}
						userEmail={firstComment?.email}
					/>
					<span className="text-[10px] font-semibold">
						{commentsData.length}+
					</span>
				</div>
			) : (
				<div className="text-[#333333] text-[11px] font-semibold ">
					<Plus size={12} color="#333333" weight="bold" />
				</div>
			)}
		</div>
	);
}
