import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel';
import { useCallback, useRef, useEffect } from 'react';
import CircularLoader from '../loading/CircularLoader';

export default function CustomCarousel({
	opts,
	items = [],
	renderItem,
	showArrows = true,
	isLoading,
	isFetchingNextPage,
	hasNextPage,
	fetchNextPage,
	onScroll,
}) {
	const observerRef = useRef();
	const scrollContainerRef = useRef();
	const carouselApiRef = useRef();

	// Cleanup observer on unmount
	useEffect(() => {
		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, []);

	const lastElementRef = useCallback(
		(node) => {
			if (isLoading) return;
			if (isFetchingNextPage) return;

			// Disconnect previous observer
			if (observerRef.current) {
				observerRef.current.disconnect();
			}

			// Don't create observer if no more pages
			if (!hasNextPage) return;

			observerRef.current = new IntersectionObserver(
				(entries) => {
					if (
						entries[0].isIntersecting &&
						hasNextPage &&
						!isFetchingNextPage
					) {
						console.log('Loading more sessions...', {
							hasNextPage,
							isIntersecting: entries[0].isIntersecting,
						});
						fetchNextPage();
					}
				},
				{
					root: null, // Use viewport as root for more reliable detection
					rootMargin: '100px', // Start loading when item is 100px away from viewport
					threshold: 0.1,
				},
			);

			if (node) {
				observerRef.current.observe(node);
			}
		},
		[isLoading, isFetchingNextPage, hasNextPage, fetchNextPage],
	);

	// Configure carousel options for smooth scrolling
	const carouselOpts = {
		...opts,
		dragFree: true, // Allow free scrolling instead of snapping
		containScroll: 'trimSnaps', // Trim snaps to the carousel container
	};

	// Set up scroll event listener
	useEffect(() => {
		const api = carouselApiRef.current;
		if (!api || !onScroll) return;

		const handleScroll = () => {
			onScroll();
		};

		api.on('scroll', handleScroll);

		return () => {
			api.off('scroll', handleScroll);
		};
	}, [onScroll]);

	return (
		<Carousel
			opts={carouselOpts}
			className="relative w-full"
			setApi={(api) => {
				carouselApiRef.current = api;
			}}
		>
			{showArrows && (
				<div className="absolute bottom-[calc(100%+1rem)] right-0 flex gap-2">
					<CarouselPrevious className="rounded-lg  bg-white hover:bg-gray-50" />
					<CarouselNext className="rounded-lg  bg-white hover:bg-gray-50" />
				</div>
			)}

			<CarouselContent className="-ml-4" ref={scrollContainerRef}>
				{items.map((item, index) => {
					// Use item.id if available, fallback to index
					const key = item?.id || item?.session_id || index;
					const isLast = index === items.length - 1;

					if (isLast) {
						return (
							<CarouselItem
								key={key}
								className="pl-4 basis-auto"
								ref={lastElementRef}
							>
								{renderItem(item, index)}
							</CarouselItem>
						);
					}
					return (
						<CarouselItem key={key} className="pl-4 basis-auto">
							{renderItem(item, index)}
						</CarouselItem>
					);
				})}

				{isFetchingNextPage && (
					<div className="flex items-center justify-center py-4 ml-4">
						<CircularLoader className="animate-spin size-4" />
					</div>
				)}
			</CarouselContent>
		</Carousel>
	);
}
