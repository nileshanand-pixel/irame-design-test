import { cn } from '@/lib/utils';
import { CaretUp, Chats } from '@phosphor-icons/react/dist/ssr';

export default function CommentHeading({
	handleClick,
	commentsData,
	isOpen,
	isLoadingComments,
}) {
	const commentsCount = commentsData?.length || 0;
	const arrowClassName = isOpen ? '' : 'rotate-180';

	return (
		<div className="p-2 flex justify-between items-center">
			<div className="flex items-center gap-2">
				<span>
					<Chats color="#666" className="size-6" />
				</span>
				<span className="text-sm font-semibold">Comments</span>
				<span className="text-xs">
					({isLoadingComments ? 'Loading...' : commentsCount})
				</span>
			</div>
			<div className="cursor-pointer" onClick={handleClick}>
				<CaretUp
					color="#666"
					weight="bold"
					className={cn(arrowClassName, 'size-5')}
				/>
			</div>
		</div>
	);
}
