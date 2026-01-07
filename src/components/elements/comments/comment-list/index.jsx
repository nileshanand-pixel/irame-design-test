import { cn } from '@/lib/utils';
import Comment from './comment';
import CommentListSkeleton from './skeleton';

export default function CommentList({ commentsData, isLoadingComments, className }) {
	if (isLoadingComments) {
		return <CommentListSkeleton />;
	}

	return (
		<div
			className={cn(
				'border-b border-[#D1D5DB] bg-[#fff] rounded-t-lg',
				className,
			)}
		>
			{commentsData?.length !== 0 ? (
				commentsData?.map((commentData) => (
					<Comment commentData={commentData} />
				))
			) : (
				<div className="text-md text-center py-3">No comments</div>
			)}
		</div>
	);
}
