import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Get UTC date range for "today" in user's timezone
 */
export const getTodayUTCRange = () => {
	const userTz = dayjs.tz.guess();
	const now = dayjs().tz(userTz);

	// Start of today in user's timezone, converted to UTC
	const startOfToday = now.clone().startOf('day').tz('UTC').toISOString();

	// Current time in UTC
	const currentTime = dayjs.utc().toISOString();

	return {
		startDate: startOfToday,
		endDate: currentTime,
	};
};

/**
 * Get UTC date range for "yesterday" in user's timezone
 */
export const getYesterdayUTCRange = () => {
	const userTz = dayjs.tz.guess();
	const yesterday = dayjs().tz(userTz).subtract(1, 'day');

	// Start of yesterday in user's timezone, converted to UTC
	const startOfYesterday = yesterday
		.clone()
		.startOf('day')
		.tz('UTC')
		.toISOString();

	// End of yesterday in user's timezone, converted to UTC
	const endOfYesterday = yesterday.clone().endOf('day').tz('UTC').toISOString();

	return {
		startDate: startOfYesterday,
		endDate: endOfYesterday,
	};
};

/**
 * Get default 7-day range
 */
export const getLast7DaysRange = () => ({
	startDate: dayjs().subtract(7, 'day').startOf('day').toISOString(),
	endDate: dayjs().endOf('day').toISOString(),
});

/**
 * Get predefined date range options for DateRangePicker
 */
export const getDateRangeOptions = () => [
	{
		key: 'last_7_days',
		label: 'Last 7 Days',
		startDate: dayjs().subtract(7, 'day').startOf('day').toISOString(),
		endDate: dayjs().endOf('day').toISOString(),
	},
	{
		key: 'today',
		label: 'Today',
		...getTodayUTCRange(),
	},
	{
		key: 'yesterday',
		label: 'Yesterday',
		...getYesterdayUTCRange(),
	},
	{
		key: 'last_30_days',
		label: 'Last 30 Days',
		startDate: dayjs().subtract(30, 'day').startOf('day').toISOString(),
		endDate: dayjs().endOf('day').toISOString(),
	},
	{
		key: 'last_90_days',
		label: 'Last 90 Days',
		startDate: dayjs().subtract(90, 'day').startOf('day').toISOString(),
		endDate: dayjs().endOf('day').toISOString(),
	},
];

/**
 * Check if two date ranges are equal (comparing by day)
 */
export const areDateRangesEqual = (range1, range2) => {
	return (
		dayjs(range1.startDate).isSame(range2.startDate, 'day') &&
		dayjs(range1.endDate).isSame(range2.endDate, 'day')
	);
};

/**
 * Format timestamp for display in user's timezone
 */
export const formatTimestamp = (timestamp) => {
	if (!timestamp) return { date: null, time: null };

	const userTz = dayjs.tz.guess();
	const parsed = dayjs.utc(timestamp).tz(userTz);

	return {
		date: parsed.format('DD-MM-YYYY'),
		time: parsed.format('hh:mm A'),
	};
};
