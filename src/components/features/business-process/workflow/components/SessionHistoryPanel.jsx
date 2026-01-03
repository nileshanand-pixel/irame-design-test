import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getWorkflowRuns } from '../../service/workflow.service';

const getStatusStyles = (status) => {
	switch (status) {
		case 'IN_QUEUE':
			return 'bg-[#FFFAEB] text-[rgb(181,71,8)]';
		case 'RUNNING':
			return 'bg-blue-100 text-blue-600';
		case 'COMPLETED':
			return 'bg-[#ECFDF3] text-[rgb(2,122,72)]';
		case 'FAILED':
			return 'bg-red-100 text-red-600';
		default:
			return 'bg-gray-100 text-gray-600';
	}
};

const StatusBadge = ({ status }) => (
	<span
		className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusStyles(status)}`}
	>
		{status}
	</span>
);

const isLinkActive = (status) => ['RUNNING', 'COMPLETED', 'FAILED'].includes(status);

const formatDate = (dateString) => {
	if (!dateString) return '';
	const date = new Date(dateString);
	return date.toLocaleDateString('en-GB'); // Adjust format as needed
};

const SessionHistoryPanel = ({ onClose }) => {
	const { workflowId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();

	// Get current run_id from URL query params
	const searchParams = new URLSearchParams(location.search);
	const currentRunId = searchParams.get('run_id');

	const {
		data: runDetails,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ['workflow-runs', workflowId],
		queryFn: () => getWorkflowRuns(workflowId),
		enabled: Boolean(workflowId),
		refetchInterval: 60000,
	});

	const handleRowClick = ({ runId, linkActive, sessionUrl, datasourceId }) => {
		if (linkActive) {
			window.open(sessionUrl, '_blank', 'noopener,noreferrer');
		} else {
			searchParams.set('run_id', runId);
			if (datasourceId) {
				searchParams.set('datasource_id', datasourceId);
			}
			navigate({
				pathname: location.pathname,
				search: searchParams.toString(),
			});
		}
	};

	if (isLoading) {
		return (
			<div className="p-4">
				<h2 className="text-xl font-semibold mb-2">Session History</h2>
				<p>Loading...</p>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="p-4">
				<h2 className="text-xl font-semibold mb-2">Session History</h2>
				<p className="text-red-600">Error: {error.message}</p>
			</div>
		);
	}

	const runs = runDetails?.results || [];

	return (
		<div className="w-full h-full flex flex-col">
			{/* Header */}
			<div className="flex justify-between items-center text-primary80 p-4">
				<h2 className="text-xl font-semibold flex items-center space-x-2">
					<span className="material-symbols-outlined text-2xl">
						history
					</span>
					<span>Session History</span>
				</h2>
				<span
					onClick={onClose}
					className="material-symbols-outlined text-black/40 cursor-pointer text-2xl"
				>
					close
				</span>
			</div>

			{/* Grid Container */}
			<div className="flex-1 w-[95%] mx-auto overflow-y-auto">
				<div className="relative bg-white h-[97%] mb-5 overflow-y-auto overflow-x-hidden shadow-md border-2 rounded-2xl">
					{/* Grid Header */}
					<div className="sticky top-0 grid grid-cols-12 bg-gray-100 text-black/40 font-semibold text-sm py-3 px-4 border-b-2 z-10">
						<div className="col-span-3">Date</div>
						<div className="col-span-6">Session Link</div>
						<div className="col-span-3">Status</div>
					</div>

					{/* Grid Content */}
					<div className="divide-y text-black/60 overflow-x-auto show-scrollbar h-full">
						{runs.map((item) => {
							const linkActive = isLinkActive(item.status);
							const sessionUrl = `${window.location.origin}/app/new-chat/session/?sessionId=${item.session_id}&source=workflow&datasource_id=${item.datasource_id}`;

							// Determine if this row is the selected one
							const isSelected = currentRunId === item.external_id;

							return (
								<div
									key={item.external_id}
									className={`grid grid-cols-12 items-center py-5 px-4 hover:bg-gray-100 cursor-pointer ${
										isSelected ? 'bg-purple-50' : ''
									}`}
									onClick={() =>
										handleRowClick({
											runId: item.external_id,
											linkActive,
											sessionUrl,
											datasourceId: item.datasource_id,
										})
									}
								>
									<div className="col-span-3">
										{formatDate(item.created_at)}
									</div>

									{/* Session Link Column */}
									<div className="col-span-6 truncate flex items-center">
										<span
											className="truncate text-black/80 max-w-52 overflow-hidden text-ellipsis"
											title={sessionUrl}
										>
											{sessionUrl}
										</span>
										{linkActive && (
											<span className="material-symbols-outlined text-primary80 ml-1 text-xl">
												open_in_new
											</span>
										)}
									</div>

									{/* Status Column */}
									<div className="col-span-3 whitespace-nowrap">
										<StatusBadge status={item.status} />
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default SessionHistoryPanel;
