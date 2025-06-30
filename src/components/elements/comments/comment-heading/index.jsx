import { CaretUp, Chats } from "@phosphor-icons/react/dist/ssr";

export default function CommentHeading({
    handleClick,
    commentsData,
    isOpen,
    isLoadingComments
}) {
    const commentsCount = commentsData?.length || 0;
    const arrowClassName = isOpen ? "" : "rotate-180"

    return (
        <div 
            className="p-2 flex justify-between items-center"
        >
            <div className="flex items-center gap-2">
                <span>
                    <Chats size={24} color="#666" />
                </span>
                <span className="text-sm font-semibold">Comments</span>
                <span className="text-xs">
                    ({isLoadingComments ? "Loading..." : commentsCount})
                </span>
            </div>
            <div className="cursor-pointer" onClick={handleClick}>
                <CaretUp size={20} color="#666" weight="bold" className={arrowClassName}/>
            </div>
        </div>
    )
}