import dayjs from 'dayjs';

export function formatRelativeTime(date) {
	const now = new Date();
	const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

	if (diffInSeconds < 60) {
		return 'just now';
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 30) {
		return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
	}

	const diffInMonths = Math.floor(diffInDays / 30);
	if (diffInMonths < 12) {
		return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
	}

	const diffInYears = Math.floor(diffInMonths / 12);
	return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}

export const groupItemsByDate = (items, dateKey) => {
	const today = [];
	const yesterday = [];
	const last7Days = [];
	const earlier = [];

	items.forEach((item) => {
		const itemDate = dayjs(item[dateKey]);
		if (itemDate.isToday()) {
			today.push(item);
		} else if (itemDate.isYesterday()) {
			yesterday.push(item);
		} else if (itemDate.isAfter(dayjs().subtract(7, 'day'))) {
			last7Days.push(item);
		} else {
			earlier.push(item);
		}
	});

	return {
		today,
		yesterday,
		last7Days,
		earlier,
		groupArray: [
			{
				data: today,
				label: 'Today',
			},
			{
				data: yesterday,
				label: 'Yesterday',
			},
			{
				data: last7Days,
				label: 'Last 7 days',
			},
			{
				data: earlier,
				label: 'Earlier',
			},
		],
	};
};
