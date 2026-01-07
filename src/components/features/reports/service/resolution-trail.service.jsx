import axiosClientV1 from '@/lib/axios';

/**
 * Retrieve complete audit trail for a specific case
 * @param {Object} params - Parameters for the API call
 * @param {string} params.reportId - Unique identifier of the report
 * @param {string} params.cardId - Unique identifier of the card
 * @param {string} params.caseId - Unique identifier of the case
 * @param {string} [params.type] - Filter type: 'comment' or 'action' (optional)
 * @returns {Promise<Array>} Array of trail items with comments and actions
 */
export const getResolutionTrail = async ({ reportId, cardId, caseId, type }) => {
	if (!reportId || !cardId || !caseId) {
		throw new Error('Missing required parameters: reportId, cardId, caseId');
	}

	const params = {};
	if (type) {
		params.type = type;
	}

	const response = await axiosClientV1.get(
		`/report-cards/${reportId}/cards/${cardId}/cases/${caseId}/trail`,
		{
			params,
		},
	);

	return response.data || [];
};

/**
 * Update data for a specific case
 * @param {Object} params - Parameters for the API call
 * @param {string} params.reportId - Unique identifier of the report
 * @param {string} params.cardId - Unique identifier of the card
 * @param {string} params.caseId - Unique identifier of the case
 * @param {Object} params.updates - Key-value pairs of columns to update:
 *   - status: string ('in_progress', 'pending', 'completed', 'resolved')
 *   - severity: string ('low', 'medium', 'high')
 *   - action: string ('need_action', 'business_as_usual', etc.)
 *   - due_date: date string in YYYY-MM-DD format
 *   - assigned_to: array of user IDs
 *   - description: string
 *   - comments: integer (count of comments)
 *   - Other standard or custom fields
 * @param {boolean} [params.isSample] - Whether updating sample dataset (default: false)
 * @param {string} [params.commentMessage] - Optional comment to store with trail item
 * @param {Array<string>} [params.fileUrls] - Optional array of file URLs for FileUploaded actions
 * @returns {Promise<Object>} Response with case_id and success message
 */
export const updateCaseData = async ({
	reportId,
	cardId,
	caseId,
	updates,
	isSample = false,
	commentMessage,
	fileUrls,
}) => {
	if (!reportId || !cardId || !caseId) {
		throw new Error('Missing required parameters: reportId, cardId, caseId');
	}

	if (!updates || Object.keys(updates).length === 0) {
		if (!commentMessage && !fileUrls?.length) {
			throw new Error('Updates object cannot be empty');
		}
	}

	const requestBody = {
		updates: updates || {},
		is_sample: isSample,
	};

	if (commentMessage) {
		requestBody.comment_message = commentMessage;
	}

	if (fileUrls && fileUrls.length > 0) {
		requestBody.file_urls = fileUrls;
	}

	const response = await axiosClientV1.post(
		`/report-cards/${reportId}/cards/${cardId}/cases/${caseId}`,
		requestBody,
	);

	return response.data;
};

/**
 * Fetch case details
 * @param {Object} params - Parameters for the API call
 * @param {string} params.reportId - Unique identifier of the report
 * @param {string} params.cardId - Unique identifier of the card
 * @param {string} params.caseId - Unique identifier of the case
 * @returns {Promise<Object>} Case details object
 */
export const getCaseDetails = async ({ reportId, cardId, caseId }) => {
	if (!reportId || !cardId || !caseId) {
		throw new Error('Missing required parameters: reportId, cardId, caseId');
	}

	const response = await axiosClientV1.get(
		`/report-cards/${reportId}/cards/${cardId}/cases/${caseId}`,
	);

	return response.data;
};
