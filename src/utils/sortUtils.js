/**
 * Sort reports based on the sort type
 * @param {Array} reports - Array of reports to sort
 * @param {String} sortType - Type of sort: "asc", "desc", "updated", "created"
 * @returns {Array} - Sorted array
 */
export const sortReports = (reports, sortType = 'asc') => {
	if (!reports || reports.length === 0) return reports;

	// Create a copy to avoid mutating original array
	const sorted = [...reports];

	switch (sortType) {
		case 'asc':
			// Sort by name A-Z
			return sorted.sort((a, b) => {
				const nameA = (a.name || a.title || '').toLowerCase();
				const nameB = (b.name || b.title || '').toLowerCase();
				return nameA.localeCompare(nameB);
			});

		case 'desc':
			// Sort by name Z-A
			return sorted.sort((a, b) => {
				const nameA = (a.name || a.title || '').toLowerCase();
				const nameB = (b.name || b.title || '').toLowerCase();
				return nameB.localeCompare(nameA);
			});

		case 'updated':
			// Sort by last updated (newest first)
			return sorted.sort((a, b) => {
				const dateA = new Date(a.updated_at || 0);
				const dateB = new Date(b.updated_at || 0);
				return dateB - dateA; // Newest first
			});

		case 'created':
			// Sort by date created (newest first)
			return sorted.sort((a, b) => {
				const dateA = new Date(a.created_at || 0);
				const dateB = new Date(b.created_at || 0);
				return dateB - dateA; // Newest first
			});

		default:
			return sorted;
	}
};
