import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import capitalize from 'lodash.capitalize';

// WorkflowCard Component
const WorkflowCard = ({ workflow }) => {
	const isActive = workflow.status === 'ACTIVE';

	return (
		<Card
			className={`mb-4 ${isActive ? 'bg-purple-4' : 'bg-misc-black4'} text-primary80 border-none`}
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-4">
					<span className="material-symbols-outlined text-3xl">
						splitscreen_add
					</span>
					<div className="flex flex-col">
						{/* Updated typography for name */}
						<p className="text-lg font-semibold text-primary100">
							{capitalize(workflow.name)}
						</p>
						{/* Updated typography for description */}
						<p className="text-primary80 mb-3">
							{capitalize(workflow.description)}
						</p>
						<div className="flex gap-2">
							{/* Updated typography for tags */}
							{workflow.tags.map((tag, index) => (
								<Badge
									key={index}
									variant="outline"
									className="px-2 py-1 bg-primary4 border-none"
								>
									{capitalize(tag)}
								</Badge>
							))}
							{/* Status badge */}
							<Badge
								variant={isActive ? 'default' : 'secondary'}
								className={
									isActive ? 'bg-purple-600' : 'bg-misc-black8'
								}
							>
								{capitalize(workflow.status.toLowerCase())}
							</Badge>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

// Loading Skeleton Component
const WorkflowSkeleton = () => {
	return (
		<Card className="mb-4">
			<CardContent className="p-6">
				<div className="flex items-start gap-4">
					<Skeleton className="h-6 w-6" />
					<div className="flex-1">
						<Skeleton className="h-6 w-1/3 mb-2" />
						<Skeleton className="h-4 w-2/3 mb-3" />
						<div className="flex gap-2">
							<Skeleton className="h-5 w-16" />
							<Skeleton className="h-5 w-16" />
							<Skeleton className="h-5 w-16" />
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

// Main Component
const SingleBusinessProcessPage = () => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [isFocused, setIsFocused] = useState(false);

	// Simplified mock data
	const generateMockWorkflows = (pageNum) => {
		return Array.from({ length: 3 }, (_, i) => ({
			external_id: `mock-id-${pageNum * 3 + i}`,
			name: [
				'Procure to Pay (P2P)',
				'Order to Cash (O2C)',
				'Record to Report (R2R)',
			][i % 3],
			description: [
				'End-to-end procurement and payment process.',
				'End-to-end order management and cash collection.',
				'End-to-end financial reporting and compliance.',
			][i % 3],
			tags: [
				['p2p', 'procurement', 'finance'],
				['o2c', 'sales', 'finance'],
				['r2r', 'finance', 'compliance'],
			][i % 3],
			status: i % 3 !== 2 ? 'ACTIVE' : 'INACTIVE', // Alternate status for mock data
		}));
	};

	const [workflows, setWorkflows] = useState(generateMockWorkflows(1));

	// Infinite scroll handler
	const handleScroll = (e) => {
		const bottom =
			Math.abs(
				e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight,
			) < 1;

		if (bottom && !isLoading) {
			setIsLoading(true);
			setPage((prev) => prev + 1);
		}
	};

	// Load more data
	useEffect(() => {
		const newWorkflows = generateMockWorkflows(page);
		setWorkflows((prev) => [...prev, ...newWorkflows]);
		setIsLoading(false);
	}, [page]);

	// Filter workflows based on search text
	const filteredWorkflows = useMemo(() => {
		if (!search) return workflows;

		return workflows.filter((workflow) => {
			const nameMatch = workflow?.name
				?.toLowerCase()
				.startsWith(search.toLowerCase());
			const tagsMatch = workflow?.tags?.some((tag) =>
				tag.toLowerCase().startsWith(search.toLowerCase()),
			);
			return nameMatch || tagsMatch;
		});
	}, [workflows, search]);

	return (
		<div className="h-full w-full text-primary80">
			{/* Header - Fixed while scrolling */}
			<div className="max-w-full mb-6">
				<div className="flex items-center gap-2 mb-4">
					<h1
						onClick={() => navigate('/app/business-process')}
						className="text-2xl font-semibold cursor-pointer"
					>
						Business Process
					</h1>
					<span>/</span>
					<span>Finance</span>
				</div>
			</div>

			<div className="max-w-full p-2 border-2 border-primary8 shadow-1xl bg-white rounded-3xl">
				<div className="w-full px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							<h3 className="text-xl font-semibold">Finance</h3>
							<p className="text-primary40">
								Manage, view and edit your workflows
							</p>
						</div>
						<div className="flex flex-col sm:flex-row justify-between gap-4">
							<div
								className={cn(
									'flex items-center border rounded-[52px] h-11 pl-4 pr-6 transition-width duration-300',
									{
										'w-[300px]': isFocused,
										'w-[180px]': !isFocused,
									},
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
							<Button
								className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
								onClick={() =>
									alert('implement create new workflow')
								}
							>
								Create New Workflow
							</Button>
						</div>
					</div>
				</div>

				{/* Scrollable cards container with its own rounded corners */}
				<div
					className="px-4 py-2 mb-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-270px)]"
					onScroll={handleScroll}
				>
					{isLoading ? (
						<>
							<WorkflowSkeleton />
							<WorkflowSkeleton />
							<WorkflowSkeleton />
						</>
					) : (
						filteredWorkflows.map((workflow) => (
							<WorkflowCard
								key={workflow.external_id}
								workflow={workflow}
							/>
						))
					)}
				</div>
			</div>
		</div>
	);
};

export default SingleBusinessProcessPage;
