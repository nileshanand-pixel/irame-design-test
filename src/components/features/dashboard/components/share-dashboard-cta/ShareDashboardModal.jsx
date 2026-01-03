import React, { useState, useCallback } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LuUserPlus, LuShare2, LuCopy, LuChevronDown } from 'react-icons/lu';

const ShareDashboardModal = ({ open, onOpenChange }) => {
	const [inviteEmail, setInviteEmail] = useState('');
	const [invitedUsers, setInvitedUsers] = useState([
		{
			id: '1',
			name: 'Aarav Mehta',
			email: 'aarav.mehta@example.com',
			role: 'Owner',
			access: 'Full Access',
		},
		{
			id: '2',
			name: 'Aarav Mehta',
			email: 'aarav.mehta@example.com',
			access: 'Full Access',
		},
	]);
	const [generalAccess, setGeneralAccess] = useState('Only Invited Users');

	const handleInvite = useCallback(() => {
		if (!inviteEmail.trim()) return;
		// TODO: Implement invite logic
		setInviteEmail('');
	}, [inviteEmail]);

	const handleCopyLink = useCallback(() => {
		// TODO: Implement copy link logic
		navigator.clipboard.writeText(window.location.href);
	}, []);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] p-0">
				<DialogHeader className="px-6 pt-6 pb-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-white border-2 border-[#6a12cd]/20 flex items-center justify-center">
								<LuUserPlus className="w-5 h-5 text-[#6A12CD]" />
							</div>
							<DialogTitle className="text-xl font-semibold text-[#26064A]">
								Share this dashboard
							</DialogTitle>
						</div>
						{/* <button
							onClick={() => onOpenChange(false)}
							className="text-gray-500 hover:text-gray-700 transition-colors"
						>
							<X className="w-5 h-5" />
						</button> */}
					</div>
				</DialogHeader>

				<div className="px-6 pb-6 space-y-6">
					{/* Invite Input */}
					<div className="flex items-center gap-2">
						<Input
							placeholder="Email, Team & Users"
							value={inviteEmail}
							onChange={(e) => setInviteEmail(e.target.value)}
							className="flex-1 border-gray-200 bg-white text-[#26064A] placeholder:text-gray-400"
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleInvite();
								}
							}}
						/>
						<Button
							onClick={handleInvite}
							className="bg-[#6A12CD] hover:bg-[#6912CC] text-white px-4 py-2 rounded-lg"
						>
							Invite
						</Button>
					</div>

					{/* Invited Users List */}
					<div className="space-y-4">
						{invitedUsers.map((user) => (
							<div
								key={user.id}
								className="flex items-center justify-between"
							>
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<span className="text-base font-medium text-[#26064A]">
											{user.name}
										</span>
										{user.role && (
											<span className="px-2 py-0.5 text-xs font-medium bg-[#FEF3C7] text-[#92400E] rounded-full">
												{user.role}
											</span>
										)}
									</div>
									<p className="text-sm text-[#6A12CD]/80">
										{user.email}
									</p>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											className="text-[#6A12CD] hover:text-[#6A12CD] hover:bg-[#6A12CD]/10 flex items-center gap-1"
										>
											<span className="text-sm font-medium">
												{user.access}
											</span>
											<LuChevronDown className="w-4 h-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem>
											Full Access
										</DropdownMenuItem>
										<DropdownMenuItem>
											View Only
										</DropdownMenuItem>
										<DropdownMenuItem>
											Edit Access
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						))}
					</div>

					{/* General Access */}
					<div className="space-y-2">
						<p className="text-sm text-gray-500">General Access</p>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-between border-gray-200 bg-white text-[#26064A] hover:bg-gray-50"
								>
									<div className="flex items-center gap-2">
										<svg
											className="w-4 h-4 text-[#6A12CD]"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
											/>
										</svg>
										<span className="text-sm font-medium">
											{generalAccess}
										</span>
									</div>
									<LuChevronDown className="w-4 h-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="w-full">
								<DropdownMenuItem
									onClick={() =>
										setGeneralAccess('Only Invited Users')
									}
								>
									Only Invited Users
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										setGeneralAccess('Anyone with link')
									}
								>
									Anyone with link
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Copy Link */}
					<Button
						onClick={handleCopyLink}
						variant="ghost"
						className="w-full justify-start text-[#6A12CD] hover:text-[#6A12CD] hover:bg-[#6A12CD]/10"
					>
						<LuCopy className="w-4 h-4 mr-2" />
						<span className="text-sm font-medium">Copy Link</span>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ShareDashboardModal;
