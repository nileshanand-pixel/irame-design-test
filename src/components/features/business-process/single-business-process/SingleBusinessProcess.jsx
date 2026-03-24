import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/elements/EmptyState';
import WorkflowCard from './WorkflowCard';
import WorkflowSkeleton from './WorkflowCardSkeleton';
import {
	getBusinessProcesses,
	getWorkflowsByBusinessProcess,
} from '../service/workflow.service';
import BreadCrumbs from '@/components/BreadCrumbs';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import useWorkflowProcessingStatus from '@/hooks/useWorkflowProcessingStatus';

const EmptyStateWrapper = ({ config }) => (
	<div className="flex justify-center">
		<EmptyState className="h-full" config={config} />
	</div>
);

const SearchBar = ({ search, setSearch, isFocused, setIsFocused }) => (
	<div
		className={cn(
			'flex items-center border rounded-[52px] h-11 pl-4 pr-6 transition-width duration-300',
			{ 'w-[18.75rem]': isFocused, 'w-[11.25rem]': !isFocused },
		)}
	>
		<i className="bi-search text-primary40 me-2"></i>
		<Input
			placeholder="Search"
			className={cn(
				'border-none rounded-sm px-0 text-primary40 font-medium bg-transparent',
			)}
			value={search}
			onChange={(e) => setSearch(e.target.value)}
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
		/>
	</div>
);

const SingleBusinessProcessPage = () => {
	const navigate = useNavigate();
	const { businessProcessId } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [isFocused, setIsFocused] = useState(false);
	const [highlightedWorkflowId, setHighlightedWorkflowId] = useState(null);
	const [isHighlightVisible, setIsHighlightVisible] = useState(false);
	const workflowListRef = useRef(null);
	const highlightedWorkflowRef = useRef(null);

	// Debounce the search
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	// Fetch business processes (for breadcrumb/header only)
	const { data: businessProcessesData, isLoading: isBusinessLoading } = useQuery({
		queryKey: ['get-business-processes'],
		queryFn: () => getBusinessProcesses(),
	});

	// Fetch workflows with pagination and polling
	const {
		data: workflows,
		isLoading: isWorkflowsLoading,
		Sentinel,
		isFetchingNextPage,
	} = useInfiniteScroll({
		queryKey: [
			'get-workflows-by-business-process',
			businessProcessId,
			debouncedSearch,
		],
		queryFn: (params) =>
			getWorkflowsByBusinessProcess({
				businessProcessId,
				limit: 100,
				search: debouncedSearch || undefined,
				...params,
			}),
		paginationType: 'cursor',
		options: {
			limit: 100,
			staleTime: 1000 * 60,
			enabled: !!businessProcessId,
		},
	});

	const { statusMap } = useWorkflowProcessingStatus(businessProcessId);

	// Find matching business process
	const businessProcess = useMemo(() => {
		return businessProcessesData?.processes?.find(
			(bp) => bp.external_id === businessProcessId,
		);
	}, [businessProcessesData, businessProcessId]);

	// Handle workflow highlighting from URL parameter
	useEffect(() => {
		const workflowId = searchParams.get('highlightWorkflow');
		if (workflowId && workflows.length > 0) {
			// Find the workflow that matches the ID (could be external_id or workflow_check_id)
			const targetWorkflow = workflows.find(
				(workflow) =>
					String(workflow.external_id) === String(workflowId) ||
					String(workflow.workflow_check_id) === String(workflowId),
			);

			if (targetWorkflow) {
				setHighlightedWorkflowId(targetWorkflow.external_id);
				setIsHighlightVisible(false); // Reset visibility state

				// Scroll to bottom smoothly after a short delay to ensure DOM is ready
				setTimeout(() => {
					if (workflowListRef.current) {
						workflowListRef.current.scrollTo({
							top: workflowListRef.current.scrollHeight,
							behavior: 'smooth',
						});
					}

					// Remove highlight after 5 seconds (2.5s animation x 2 iterations)
					setTimeout(() => {
						setHighlightedWorkflowId(null);
						setIsHighlightVisible(false);
						// Clear URL parameter
						setSearchParams((params) => {
							params.delete('highlightWorkflow');
							return params;
						});
					}, 5000);
				}, 300);
			}
		}
	}, [searchParams, workflows, setSearchParams]);

	// Intersection Observer for highlighted workflow
	useEffect(() => {
		if (!highlightedWorkflowId || !highlightedWorkflowRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsHighlightVisible(true);
					}
				});
			},
			{
				threshold: 0.1, // Trigger when 10% of the element is visible
				root: workflowListRef.current,
			},
		);

		observer.observe(highlightedWorkflowRef.current);

		return () => {
			observer.disconnect();
		};
	}, [highlightedWorkflowId]);

	// Skeleton components
	const BreadcrumbSkeleton = () => (
		<div className="h-6 w-48 bg-primary10 rounded animate-pulse"></div>
	);

	const HeaderSkeleton = () => (
		<>
			<div className="h-7 w-32 bg-primary10 rounded animate-pulse"></div>
			<div className="h-5 w-64 bg-primary10 rounded animate-pulse"></div>
		</>
	);

	const emptyStateConfig = {
		image: 'https://d2vkmtgu2mxkyq.cloudfront.net/empty-state.svg',
		actionText: 'Create your first workflow by clicking the button above,',
		reactionText: 'your workflows will appear here...',
		ctaText: 'Create New Workflow',
		ctaDisabled: true,
		ctaClickHandler: () => {},
		comingSoonText: 'Custom workflow creation coming soon...',
	};

	return (
		<div className="h-full flex flex-col w-full text-primary80 px-8">
			<header className="max-w-full flex-none mb-2">
				<BreadCrumbs
					items={[
						{
							label: 'Business Process',
							icon: 'https://d2vkmtgu2mxkyq.cloudfront.net/workflow_icon.svg',
							path: '/app/business-process',
						},
						{
							label: isBusinessLoading ? (
								<BreadcrumbSkeleton />
							) : (
								businessProcess?.name || 'Unnamed Process'
							),
						},
					]}
				/>
			</header>

			<section className="max-w-full flex flex-col flex-1 py-2 pl-2 mr-2 mb-4 border-2 border-primary8 shadow-1xl bg-white rounded-3xl overflow-y-hidden">
				<div className="w-full flex-none px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							{isBusinessLoading ? (
								<HeaderSkeleton />
							) : (
								<>
									<h3 className="text-xl font-semibold">
										Workflows
									</h3>
									<p className="text-primary40 text-sm">
										Manage, view and edit your workflows
									</p>
								</>
							)}
						</div>
						<div className="flex flex-row justify-between gap-4">
							<SearchBar
								search={search}
								setSearch={setSearch}
								isFocused={isFocused}
								setIsFocused={setIsFocused}
							/>
						</div>
					</div>
				</div>

				<div
					ref={workflowListRef}
					className="px-4 py-2 mb-4 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar"
				>
					{isWorkflowsLoading ? (
						<>
							<WorkflowSkeleton />
							<WorkflowSkeleton />
							<WorkflowSkeleton />
						</>
					) : workflows.length === 0 ? (
						<EmptyStateWrapper config={emptyStateConfig} />
					) : (
						<>
							{workflows.map((workflow) => (
								<WorkflowCard
									key={workflow.external_id}
									workflow={workflow}
									statusMap={statusMap}
									isHighlighted={
										highlightedWorkflowId ===
										workflow.external_id
									}
									isHighlightVisible={
										isHighlightVisible &&
										highlightedWorkflowId ===
											workflow.external_id
									}
									highlightedRef={
										highlightedWorkflowId ===
										workflow.external_id
											? highlightedWorkflowRef
											: null
									}
								/>
							))}
							<Sentinel />
						</>
					)}
					{isFetchingNextPage && (
						<div className="flex justify-center py-4">
							<div className="h-6 w-6 border-2 border-primary40 border-t-transparent rounded-full animate-spin" />
						</div>
					)}
				</div>
			</section>
		</div>
	);
};

export default SingleBusinessProcessPage;
