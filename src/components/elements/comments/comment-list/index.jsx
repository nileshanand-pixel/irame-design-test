import Comment from './comment';
import CommentListSkeleton from './skeleton';

export default function CommentList({ commentsData, isLoadingComments }) {
	if (isLoadingComments) {
		return <CommentListSkeleton />;
	}

	return (
		<div className="border-b border-[#D1D5DB] bg-[#fff] rounded-t-lg">
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
