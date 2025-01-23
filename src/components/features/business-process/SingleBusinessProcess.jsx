import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import WorkflowCard from './WorkflowCard';
import WorkflowSkeleton from './WorkflowCardSkeleton';

const SingleBusinessProcessPage = () => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [isFocused, setIsFocused] = useState(false);

	const generateMockWorkflows = (pageNum) => {
		return Array.from({ length: 9 }, (_, i) => ({
			external_id: `mock-id-${pageNum * 3 + i}`,
			name: [
				'Procure to Pay (P2P)',
				'Order to Cash (O2C)',
				'Record to Report (R2R)'
			][i % 3],
			description: [
				'End-to-end procurement and payment process.',
				'End-to-end order management and cash collection.',
				'End-to-end financial reporting and compliance.'][i % 3],
			tags: [
				['p2p', 'procurement', 'finance'],
				['o2c', 'sales', 'finance'],
				['r2r', 'finance', 'compliance']			][i % 3],
			status: i % 3 !== 2 ? 'ACTIVE' : 'INACTIVE',
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
			console.log(
				'searchKey => ' + search,
				'match pass => ' + nameMatch || tagsMatch,
			);
			return nameMatch || tagsMatch;
		});
	}, [workflows, search]);

	return (
		<div className="h-full w-full text-primary80">
			<Header navigate={navigate} />
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
							<SearchBar
								search={search}
								setSearch={setSearch}
								isFocused={isFocused}
								setIsFocused={setIsFocused}
							/>
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

const SearchBar = ({ search, setSearch, isFocused, setIsFocused }) => (
	<div
		className={cn(
			'flex items-center border rounded-[52px] h-11 pl-4 pr-6 transition-width duration-300',
			{ 'w-[300px]': isFocused, 'w-[180px]': !isFocused },
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

const Header = ({ navigate }) => (
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
);

export default SingleBusinessProcessPage;
