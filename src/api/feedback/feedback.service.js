import axiosClientV1 from '@/lib/axios';
import { toast } from '@/lib/toast';

export const submitFeedback = async ({
	entityId,
	entityType,
	feedback,
	comment,
}) => {
	try {
		const payload = {
			entity_id: entityId,
			entity_type: entityType,
			feedback,
			comment,
		};

		const response = await axiosClientV1.put(`/feedbacks`, payload, {
			headers: {},
		});

		toast.success('Feedback submitted successfully');
		return response.data;
	} catch (error) {
		toast.error('Something went wrong while submitting feedback');
		throw error;
	}
};

export const getFeedbacksByEntityIds = async (
	entityIds = [],
	entityType = 'query',
) => {
	if (!entityIds.length) return [];

	try {
		const response = await axiosClientV1.get(
			`/feedbacks?entity_id=${entityIds.join(',')}&entity_type=${entityType}`,
			{ headers: {} },
		);
		return response.data?.feedbacks || [];
	} catch (error) {
		console.error('Error fetching feedbacks by entity IDs', error);
		throw error;
	}
};

export const getFeedbacksBySession = async (sessionId) => {
	if (!sessionId) return [];

	try {
		const response = await axiosClientV1.get(
			`/feedbacks/sessions/${sessionId}`,
			{
				headers: {},
			},
		);
		return response.data?.feedbacks || [];
	} catch (error) {
		console.error('Error fetching feedbacks by session ID', error);
		throw error;
	}
};
