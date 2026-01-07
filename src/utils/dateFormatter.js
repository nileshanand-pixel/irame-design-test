/**
 * Format a date to "DD Mon YYYY" format (e.g., "10 Sep 2025")
 */
export const formatCreatedDate = (dateString) => {
	if (!dateString) return 'N/A';

	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return 'N/A';

		const day = date.getDate().toString().padStart(2, '0');
		const month = date.toLocaleDateString('en-US', { month: 'short' });
		const year = date.getFullYear();

		return `${day} ${month} ${year}`;
	} catch (error) {
		return 'N/A';
	}
};

export const formatUpdatedDate = (dateString) => {
	if (!dateString) return 'N/A';

	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return 'N/A';

		const now = new Date();
		const diffMs = now - date;
		const diffSecs = Math.floor(diffMs / 1000);
		const diffMins = Math.floor(diffSecs / 60);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		// Less than a minute
		if (diffSecs < 60) {
			return 'just now';
		}

		// Minutes
		if (diffMins < 60) {
			return `${diffMins}m ago`;
		}

		// Hours
		if (diffHours < 24) {
			return `${diffHours}h ago`;
		}

		// Yesterday
		if (diffDays === 1) {
			return 'Yesterday';
		}

		// Less than 7 days
		if (diffDays < 7) {
			return `${diffDays}d ago`;
		}

		// More than 7 days - show as date
		return formatCreatedDate(dateString);
	} catch (error) {
		return 'N/A';
	}
};
