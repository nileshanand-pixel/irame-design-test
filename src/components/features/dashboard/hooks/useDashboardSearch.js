import { useState, useEffect, useMemo } from 'react';

/**
 * Hook for debounced search input
 * @param {number} delay
 * @returns {[string, string, function]}
 */
export const useDebouncedSearch = (delay = 300) => {
	const [searchValue, setSearchValue] = useState('');
	const [debouncedValue, setDebouncedValue] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(searchValue);
		}, delay);

		return () => clearTimeout(timer);
	}, [searchValue, delay]);

	return [searchValue, debouncedValue, setSearchValue];
};

/**
 * Hook for filtering dashboards with search and time filter
 */
export const useDashboardFilter = (dashboards, searchQuery, timeFilter) => {
	return useMemo(() => {
		let filtered = [...dashboards];

		if (searchQuery && searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(
				(dashboard) =>
					dashboard.title?.toLowerCase().includes(query) ||
					dashboard.description?.toLowerCase().includes(query) ||
					dashboard.tags?.some((tag) => tag.toLowerCase().includes(query)),
			);
		}

		// Apply sorting/filtering based on timeFilter
		switch (timeFilter) {
			case 'recently-updated':
				filtered.sort((a, b) => {
					const dateA = new Date(a.updatedAt || a.createdAt || 0);
					const dateB = new Date(b.updatedAt || b.createdAt || 0);
					return dateB - dateA;
				});
				break;

			case 'oldest-updated':
				filtered.sort((a, b) => {
					const dateA = new Date(a.updatedAt || a.createdAt || 0);
					const dateB = new Date(b.updatedAt || b.createdAt || 0);
					return dateA - dateB;
				});
				break;

			case 'a-z':
				filtered.sort((a, b) => {
					const titleA = (a.title || '').toLowerCase();
					const titleB = (b.title || '').toLowerCase();
					if (titleA < titleB) return -1;
					if (titleA > titleB) return 1;
					return 0;
				});
				break;

			case 'z-a':
				filtered.sort((a, b) => {
					const titleA = (a.title || '').toLowerCase();
					const titleB = (b.title || '').toLowerCase();
					if (titleA > titleB) return -1;
					if (titleA < titleB) return 1;
					return 0;
				});
				break;

			default:
				filtered.sort((a, b) => {
					const dateA = new Date(a.updatedAt || a.createdAt || 0);
					const dateB = new Date(b.updatedAt || b.createdAt || 0);
					return dateB - dateA;
				});
		}

		return filtered;
	}, [dashboards, searchQuery, timeFilter]);
};
