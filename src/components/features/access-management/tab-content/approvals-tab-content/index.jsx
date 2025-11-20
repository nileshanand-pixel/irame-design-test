import { useState, useMemo } from 'react';
import allClear from '@/assets/icons/all-clear.svg';
import EmptyState from '../empty-state';
import { Button } from '@/components/ui/button';
import userPlusIcon from '@/assets/icons/user-plus.svg';
import shieldIcon from '@/assets/icons/shield.svg';
import keyIcon from '@/assets/icons/key.svg';
import clockIcon from '@/assets/icons/clock.svg';
import SearchBar from '../../search-bar';
import { cn } from '@/lib/utils';

const EMPTY_STATE_CONFIG = {
	image: allClear,
	heading: 'All Clear !',
	descriptionLines: [
		'No pending approvals at the moment. New requests will',
		'appear here when submitted. ',
	],
};

const getRequestTypeIcon = (requestType) => {
	switch (requestType) {
		case 'Join Team':
			return userPlusIcon;
		case 'Role Change':
			return shieldIcon;
		case 'Resource Access':
			return keyIcon;
		default:
			return shieldIcon;
	}
};

const formatTimeAgo = (dateString) => {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now - date;
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffHours < 1) {
		return 'Just now';
	} else if (diffHours < 24) {
		return `${diffHours} Hour${diffHours === 1 ? '' : 's'} ago`;
	} else if (diffDays === 1) {
		return '1 Day ago';
	} else {
		return `${diffDays} Days ago`;
	}
};

export default function ApprovalTabContent() {
	const [search, setSearch] = useState('');
	const [approvals, setApprovals] = useState([
		{
			id: 1,
			requestedBy: 'Aarav Mehta',
			email: 'aarav.mehta@example.com',
			requestType: 'Join Team',
			requestDetails: 'wants to join Engineering Team',
			requestedOn: '2025-11-20T10:00:00',
			status: 'pending',
		},
		{
			id: 2,
			requestedBy: 'Michael Chen',
			email: 'michael.chen@example.com',
			requestType: 'Role Change',
			requestDetails:
				'requests role change from Developer to Senior Developer',
			requestedOn: '2025-11-20T07:00:00',
			status: 'pending',
		},
		{
			id: 3,
			requestedBy: 'Jessica Lee',
			email: 'jessica.lee@example.com',
			requestType: 'Resource Access',
			requestDetails: 'has completed the user feedback survey',
			requestedOn: '2025-11-19T12:00:00',
			status: 'pending',
		},
		{
			id: 1,
			requestedBy: 'Aarav Mehta',
			email: 'aarav.mehta@example.com',
			requestType: 'Join Team',
			requestDetails: 'wants to join Engineering Team',
			requestedOn: '2025-11-20T10:00:00',
			status: 'pending',
		},
		{
			id: 2,
			requestedBy: 'Michael Chen',
			email: 'michael.chen@example.com',
			requestType: 'Role Change',
			requestDetails:
				'requests role change from Developer to Senior Developer',
			requestedOn: '2025-11-20T07:00:00',
			status: 'pending',
		},
		{
			id: 3,
			requestedBy: 'Jessica Lee',
			email: 'jessica.lee@example.com',
			requestType: 'Resource Access',
			requestDetails: 'has completed the user feedback survey',
			requestedOn: '2025-11-19T12:00:00',
			status: 'pending',
		},
		{
			id: 1,
			requestedBy: 'Aarav Mehta',
			email: 'aarav.mehta@example.com',
			requestType: 'Join Team',
			requestDetails: 'wants to join Engineering Team',
			requestedOn: '2025-11-20T10:00:00',
			status: 'pending',
		},
		{
			id: 2,
			requestedBy: 'Michael Chen',
			email: 'michael.chen@example.com',
			requestType: 'Role Change',
			requestDetails:
				'requests role change from Developer to Senior Developer',
			requestedOn: '2025-11-20T07:00:00',
			status: 'pending',
		},
		{
			id: 3,
			requestedBy: 'Jessica Lee',
			email: 'jessica.lee@example.com',
			requestType: 'Resource Access',
			requestDetails: 'has completed the user feedback survey',
			requestedOn: '2025-11-19T12:00:00',
			status: 'pending',
		},
		{
			id: 1,
			requestedBy: 'Aarav Mehta',
			email: 'aarav.mehta@example.com',
			requestType: 'Join Team',
			requestDetails: 'wants to join Engineering Team',
			requestedOn: '2025-11-20T10:00:00',
			status: 'pending',
		},
		{
			id: 2,
			requestedBy: 'Michael Chen',
			email: 'michael.chen@example.com',
			requestType: 'Role Change',
			requestDetails:
				'requests role change from Developer to Senior Developer',
			requestedOn: '2025-11-20T07:00:00',
			status: 'pending',
		},
		{
			id: 3,
			requestedBy: 'Jessica Lee',
			email: 'jessica.lee@example.com',
			requestType: 'Resource Access',
			requestDetails: 'has completed the user feedback survey',
			requestedOn: '2025-11-19T12:00:00',
			status: 'pending',
		},
	]);

	const filteredApprovals = useMemo(() => {
		return approvals
			.filter((approval) => approval.status === 'pending')
			.filter(
				(approval) =>
					approval.requestedBy
						.toLowerCase()
						.includes(search.toLowerCase()) ||
					approval.email.toLowerCase().includes(search.toLowerCase()) ||
					approval.requestType
						.toLowerCase()
						.includes(search.toLowerCase()) ||
					approval.requestDetails
						.toLowerCase()
						.includes(search.toLowerCase()),
			);
	}, [approvals, search]);

	const handleApprove = (approvalId) => {
		console.log('Approve:', approvalId);
		// Implement approval logic
	};

	const handleReject = (approvalId) => {
		console.log('Reject:', approvalId);
		// Implement rejection logic
	};

	const handleApproveAll = () => {
		console.log('Approve all pending requests');
		// Implement approve all logic
	};

	return (
		<div className="w-full h-full ">
			{filteredApprovals.length === 0 && !search ? (
				<EmptyState config={EMPTY_STATE_CONFIG} />
			) : (
				<div className="space-y-6">
					{/* Search Bar */}
					<div>
						<SearchBar
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					{filteredApprovals.length === 0 ? (
						<div className="border border-[#0000001A] rounded-lg shadow-sm p-12 text-center">
							<p className="text-gray-500">
								No requests found matching "{search}"
							</p>
						</div>
					) : (
						<div className="border border-[#0000001A] rounded-lg shadow-sm h-[calc(100vh-15.625rem)] overflow-hidden">
							<div className="px-6 py-4 flex justify-between items-center border-b border-[#0000001A]">
								<div className="flex items-center gap-2">
									<h2 className="text-base font-semibold text-[#111827]">
										Pending Requests
									</h2>

									<div className="flex items-center justify-center bg-[#E1D0F5] p-1 rounded-full">
										<div className="flex items-center justify-center size-6 rounded-full bg-[#6A12CD] text-white text-xs font-semibold">
											{filteredApprovals.length}
										</div>
									</div>
								</div>
								<Button
									onClick={handleApproveAll}
									className="px-6 py-2 rounded-lg"
								>
									Approve All
								</Button>
							</div>

							<div className="h-[calc(100%-3.875rem)] overflow-auto pb-2">
								{filteredApprovals.map((approval, index) => (
									<div
										key={approval.id}
										className={cn(
											'px-6 py-4 border-b border-[#0000001A] flex justify-between items-center',
											index === filteredApprovals.length - 1 &&
												'border-b-0',
										)}
									>
										<div className="flex flex-col gap-2">
											<div className="flex items-center gap-2">
												<div className="flex items-center gap-1 py-1 px-2 bg-[#6A12CD0A] rounded-md">
													<img
														src={getRequestTypeIcon(
															approval.requestType,
														)}
														alt={approval.requestType}
														className="size-[0.875rem]"
													/>
													<span className="text-xs text-[#26064A] font-medium">
														{approval.requestType}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<img
														src={clockIcon}
														className="size-3"
													/>
													<span className="text-xs text-[##26064A]">
														{formatTimeAgo(
															approval?.requestedOn,
														)}
													</span>
												</div>
											</div>
											<div className="flex flex-col gap-1">
												<div className="flex gap-2 items-center">
													<span className="text-sm text-[#26064A] font-medium">
														{approval.requestedBy}
													</span>
													<span className="text-xs text-[#26064A]">
														{approval.requestDetails}
													</span>
												</div>
												<div className="text-xs text-[#26064A99]">
													@{approval.email}
												</div>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<Button
												variant="outline"
												onClick={() =>
													handleReject(approval.id)
												}
												className="border-gray-300 text-[#26064A] hover:bg-gray-50 px-6 py-2 rounded-lg"
											>
												Reject
											</Button>
											<Button
												onClick={() =>
													handleApprove(approval.id)
												}
												className="bg-[#6A12CD] hover:bg-[#5A0FBD] text-white px-6 py-2 rounded-lg"
											>
												Approve
											</Button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
