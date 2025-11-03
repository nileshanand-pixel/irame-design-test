import axiosClientV1 from '@/lib/axios';
import { toast } from '@/lib/toast';

export const shareChatSession = async (sessionId, users) => {
	try {
		const payload = {
			accesses: users.map((u) => ({ email: u.email })),
		};

		const response = await axiosClientV1.post(
			`/sessions/${sessionId}/share`,
			payload,
		);

		toast.success('Chat shared successfully');
		return response.data;
	} catch (error) {
		console.error('Error sharing chat:', error);
		toast.error('Failed to share chat');
		throw error;
	}
};

export const getShareableUsers = async () => {
	try {
		const response = await axiosClientV1.get('/sessions/shareable-users');
		return response.data?.users || [];
	} catch (error) {
		console.error('Error fetching shareable users:', error);
		toast.error('Failed to fetch shareable users');
		throw error;
	}
};

export const unshareSession = async (sessionId) => {
	const response = await axiosClientV1.put(`/sessions/${sessionId}/unshare`);

	return response.data;
};
