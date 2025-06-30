import { useCallback, useMemo } from "react";
import { addReportCardComment, addReportComment, getReportCardComments, getReportComments } from "../../service/reports.service";
import { getToken } from "@/lib/utils";
import Comments from "@/components/elements/comments";
import { queryClient } from "@/lib/react-query";

export default function ReportComments({
    withTrigger = false,
    reportId,
    reportCardId,
}) {
    const fetchComments = useCallback(async () => {
        if(reportCardId) {
            const response = await getReportCardComments(getToken(), reportId, reportCardId);
            return response;
        } else {
            const response = await getReportComments(getToken(), reportId);
            return response;
        }
    }, [reportId, reportCardId]);

    const addComment = useCallback(async (commentData) => {
        if(reportCardId) {
            const response = await addReportCardComment(getToken(), reportId, reportCardId, commentData);
            return response;
        } else {
            const response = await addReportComment(getToken(), reportId, commentData);
            return response;
        }
    }, [reportId, reportCardId]);

    const queryKey = useMemo(() => {
        if(reportCardId) {
            return ["fetch-report-card-comments", reportCardId];
        } else {
            return ["fetch-report-comments", reportId]
        }
    }, [reportId, reportCardId]);

    const onSuccessCommentAddition = useCallback(() => {
        queryClient.invalidateQueries(['activity-trail']);
        queryClient.invalidateQueries(queryKey);
    }, [queryKey]);

    return (
        <Comments 
            withTrigger={withTrigger}
            commentsFetcher={fetchComments}
            commetsAdder={addComment}
            queryKey={queryKey}
            onSuccessCommentAddition={onSuccessCommentAddition}
        />
    )
}