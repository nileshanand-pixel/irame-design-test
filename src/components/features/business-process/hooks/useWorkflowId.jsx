
import { useParams } from "react-router-dom";

export const useWorkflowId = () => {
    const params = useParams();
    return params.workflowId
}