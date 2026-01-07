import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useMemo, useCallback } from 'react';

const useInfiniteScroll = ({
	queryKey,
	queryFn,
	paginationType = 'cursor',
	options = {},
}) => {
	const sentinelRef = useRef(null);
	const queryClient = useQueryClient();

	// Determine if infinite scroll is enabled
	const isInfinite = paginationType !== 'none';

	// Extract refetchInterval from options to handle separately
	const { refetchInterval, ...infiniteOptions } = options;

	// *** Key Change Here: Make the infinite queryKey unique ***
	const infiniteQueryKey = useMemo(() => {
		if (isInfinite) {
			// Add a unique identifier to the key to prevent cache collisions
			// with regular queries using the same base key.
			return [...queryKey, 'infinite'];
		}
		return queryKey;
	}, [isInfinite, queryKey]);

	// Infinite query for paginated data
	const infiniteQuery = useInfiniteQuery({
		queryKey: infiniteQueryKey, // Use the unique key here
		queryFn: ({ pageParam }) => {
			const params = {};
			if (paginationType === 'cursor') {
				params.limit = options.limit || 20;
				if (pageParam) {
					if (typeof pageParam === 'number') {
						params.offset = pageParam;
					} else {
						params.cursor = pageParam;
					}
				}
			}
			if (paginationType === 'offset') {
				params.offset = pageParam;
				params.limit = options.limit || 20;
			}

			return queryFn(params);
		},
		// V5 requires initialPageParam
		initialPageParam: paginationType === 'offset' ? 0 : null,

		getNextPageParam: (lastPage, allPages) => {
			if (paginationType === 'cursor') {
				let cursor = null;

				cursor =
					lastPage?.cursor ||
					lastPage?.next_cursor ||
					lastPage?.nextCursor ||
					lastPage?.pagination?.cursor ||
					lastPage?.pagination?.next_cursor;

				if (!cursor && allPages.length > 0) {
					const dataArray =
						lastPage?.session_list ||
						lastPage?.sessions ||
						lastPage?.reports ||
						lastPage?.data ||
						lastPage;

					const limit = options.limit || 20;

					if (Array.isArray(dataArray)) {
						if (dataArray.length >= limit) {
							const totalItems = allPages.reduce((total, page) => {
								const pageData =
									page?.session_list ||
									page?.sessions ||
									page?.reports ||
									page?.data ||
									page;
								return (
									total +
									(Array.isArray(pageData) ? pageData.length : 0)
								);
							}, 0);
							return totalItems;
						}
					}
				}

				return cursor;
			}

			if (paginationType === 'offset') {
				const limit = options.limit || 20;
				const lastPageData =
					lastPage?.session_list ||
					lastPage?.sessions ||
					lastPage?.reports ||
					lastPage?.data ||
					lastPage;

				if (Array.isArray(lastPageData) && lastPageData.length === limit) {
					const totalItems = allPages.reduce((total, page) => {
						const pageData =
							page?.session_list ||
							page?.sessions ||
							page?.reports ||
							page?.data ||
							page;
						return (
							total + (Array.isArray(pageData) ? pageData.length : 0)
						);
					}, 0);
					return totalItems;
				}
				return undefined;
			}

			return undefined;
		},
		enabled: isInfinite,
		...infiniteOptions, // Note: refetchInterval removed
	});

	// Function to refetch only the first page by updating the cached data
	const refetchFirstPageOnly = useCallback(async () => {
		if (!isInfinite || !refetchInterval) {
			return;
		}

		try {
			// Fetch fresh first page data
			const freshFirstPage = await queryFn({ limit: options.limit || 20 });

			// Update the infinite query cache to replace only the first page
			queryClient.setQueryData(infiniteQueryKey, (oldData) => {
				if (!oldData || !oldData.pages || oldData.pages.length === 0) {
					return oldData;
				}

				// Create new pages array with updated first page
				const newPages = [...oldData.pages];
				newPages[0] = freshFirstPage; // Replace first page with fresh data

				const newData = {
					...oldData,
					pages: newPages,
				};

				return newData;
			});

			// Call onSuccess callback if provided
			if (options.onSuccess) {
				options.onSuccess(freshFirstPage);
			}
		} catch (error) {
			console.error(
				'❌ [useInfiniteScroll] Failed to refetch first page:',
				error,
			);
		}
	}, [
		isInfinite,
		refetchInterval,
		queryFn,
		options.limit,
		options.onSuccess,
		infiniteQueryKey,
		queryClient,
	]);

	// Set up interval to refetch only first page
	useEffect(() => {
		if (!isInfinite || !refetchInterval) return;

		const intervalId = setInterval(refetchFirstPageOnly, refetchInterval);

		return () => clearInterval(intervalId);
	}, [isInfinite, refetchInterval, refetchFirstPageOnly]);

	// Regular query for non-paginated data
	const regularQuery = useQuery({
		queryKey, // Use the original key here
		queryFn: () => queryFn({}),
		enabled: !isInfinite,
		...options,
	});

	// Use the appropriate query
	const query = isInfinite ? infiniteQuery : regularQuery;
	const {
		data,
		isLoading,
		isFetchingNextPage = false,
		hasNextPage = false,
		fetchNextPage = () => {},
		error,
		isError,
	} = query;

	// Flatten data from pages
	const flattenedData = useMemo(() => {
		if (!isInfinite) {
			return Array.isArray(data) ? data.filter((item) => item != null) : [];
		}

		// This is safe because `data?.pages` will be undefined if data is null/undefined
		// and the flatMap will not be called.
		const flattened = data?.pages?.flatMap((page) => {
			const pageData =
				page?.session_list ||
				page?.sessions ||
				page?.reports ||
				page?.data ||
				page;
			return Array.isArray(pageData)
				? pageData.filter((item) => item != null)
				: [];
		});

		return flattened || [];
	}, [data, isInfinite]);

	// Refs to store latest values for intersection observer callback
	const hasNextPageRef = useRef(hasNextPage);
	const isFetchingNextPageRef = useRef(isFetchingNextPage);
	const fetchNextPageRef = useRef(fetchNextPage);

	// Update refs when values change
	useEffect(() => {
		hasNextPageRef.current = hasNextPage;
	}, [hasNextPage]);

	useEffect(() => {
		isFetchingNextPageRef.current = isFetchingNextPage;
	}, [isFetchingNextPage]);

	useEffect(() => {
		fetchNextPageRef.current = fetchNextPage;
	}, [fetchNextPage]);

	// Store observer instance in a ref so it persists
	const observerRef = useRef(null);

	// Set up intersection observer when sentinel is available
	const setupObserver = useCallback(() => {
		// Clean up existing observer
		if (observerRef.current) {
			observerRef.current.disconnect();
		}

		if (!isInfinite || !sentinelRef.current) {
			return;
		}

		const sentinelElement = sentinelRef.current;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];

				if (
					entry.isIntersecting &&
					hasNextPageRef.current &&
					!isFetchingNextPageRef.current
				) {
					fetchNextPageRef.current();
				}
			},
			{
				root: null,
				rootMargin: '10px',
				threshold: 0.1,
			},
		);

		observer.observe(sentinelElement);

		observerRef.current = observer;
	}, [isInfinite]);

	// Clean up observer on unmount
	useEffect(() => {
		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, []);

	// Sentinel component
	const Sentinel = () => {
		return (
			<div
				ref={(el) => {
					if (el) {
						sentinelRef.current = el;
						// Set up observer when sentinel is mounted
						setupObserver();
					} else {
						// Clear ref when unmounted
						sentinelRef.current = null;
					}
				}}
				style={{
					height: '10px',
				}}
				data-testid="infinite-scroll-sentinel"
			/>
		);
	};

	return {
		data: flattenedData,
		isLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		error,
		isError,
		Sentinel,
	};
};

export default useInfiniteScroll;
