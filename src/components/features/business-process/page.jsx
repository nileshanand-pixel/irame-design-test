import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/elements/EmptyState';
import { getBusinessProcesses } from './service/workflow.service';
import BusinessProcessPageSkeleton from './BusinessProcessPageSkeleton';
import BusinessProcessCard from './BusinessProcessCard';
import { logError } from '@/lib/logger';

const SearchBar = ({ value, onChange }) => (
	<div className="flex items-center bg-white border rounded-[52px] h-11 pl-4 pr-6 transition-width duration-300 w-[18.75rem]">
		<i className="bi-search text-primary40 me-2"></i>
		<Input
			placeholder="Search"
			className={cn(
				'border-none rounded-sm px-0 text-primary40 font-medium bg-white',
			)}
			value={value}
			onChange={onChange}
		/>
	</div>
);

const EmptyStateWrapper = ({ config }) => (
	<div className="flex justify-center">
		<EmptyState className="h-full" config={config} />
	</div>
);

const BusinessProcessPage = () => {
	const [processes, setProcesses] = useState([]);
	const [search, setSearch] = useState('');
	const navigate = useNavigate();

	const { data, isLoading, error } = useQuery({
		queryKey: ['get-business-processes'],
		queryFn: () => getBusinessProcesses(),
	});

	useEffect(() => {
		if (data) {
			setProcesses(data.processes || []);
		}
	}, [data]);

	// Handle business processes query errors
	useEffect(() => {
		if (error) {
			logError(error, {
				feature: 'businessProcess',
				action: 'fetchBusinessProcesses',
				extra: {
					errorMessage: error.message,
					status: error.response?.status,
				},
			});
		}
	}, [error]);

	const filteredProcesses = useMemo(() => {
		if (!search) return processes;
		return processes.filter(
			({ name, tags }) =>
				name.toLowerCase().startsWith(search.toLowerCase()) ||
				tags.some((tag) =>
					tag.toLowerCase().startsWith(search.toLowerCase()),
				),
		);
	}, [processes, search]);

	const handleCardClick = (externalId) =>
		navigate(`/app/business-process/${externalId}`);

	const emptyStateConfig = {
		image: 'https://d2vkmtgu2mxkyq.cloudfront.net/empty-state.svg',
		actionText:
			'Create your first business process by clicking the button above,',
		reactionText: 'your processes will appear here...',
		ctaText: 'Create New Process',
		ctaDisabled: true,
		ctaClickHandler: () => {},
		comingSoonText: 'Custom process creation coming soon...',
	};

	return (
		<div className="h-full w-full flex flex-col px-8">
			<header className="max-w-full flex-none mb-6">
				<h1 className="text-2xl font-semibold text-primary80">
					Business Process
				</h1>
				<p className="text-primary40 text-sm">
					Manage, view and edit your workflows
				</p>
			</header>

			<section className="max-w-full flex-1 border-2 mb-4 border-primary8 bg-misc-offWhite shadow-1xl rounded-lg">
				<div className="p-4 mt-2 flex flex-row justify-between gap-4">
					<SearchBar
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					{/* <Button
						className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
						disabled
					>
						Create New Process
					</Button> */}
				</div>

				<div className="px-4 py-2 mb-4 overflow-y-auto max-h-[calc(100vh-16.875rem)]">
					{isLoading ? (
						<BusinessProcessPageSkeleton />
					) : processes.length === 0 ? (
						<EmptyStateWrapper config={emptyStateConfig} />
					) : filteredProcesses.length > 0 ? (
						<div className="grid grid-cols-3 gap-4">
							{filteredProcesses.map((process) => (
								<BusinessProcessCard
									key={process.external_id}
									process={process}
									onClick={() =>
										handleCardClick(process.external_id)
									}
								/>
							))}
						</div>
					) : (
						<div className="w-full p-6  border border-primary1 rounded-s-xl rounded-e-xl">
							<p className="text-lg text-center text-primary60 font-medium">
								No matching processes found
							</p>
						</div>
					)}
				</div>
			</section>
		</div>
	);
};

export default BusinessProcessPage;
