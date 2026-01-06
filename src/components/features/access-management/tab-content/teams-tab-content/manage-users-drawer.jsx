import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
import { Check, MoreVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	useTeamMembers,
	useAvailableUsers,
	useAddMembers,
	useRemoveMember,
	usePromoteToAdmin,
	useDemoteFromAdmin,
} from '@/hooks/use-team-members';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
import { toast } from 'react-toastify';

export default function ManageUsersDrawer({ open, setOpen, team }) {
	const teamId = team?.id || team?.externalId;
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [ConfirmDialog, confirm] = useConfirmDialog();

	const { data: membersData, isLoading: isLoadingMembers } =
		useTeamMembers(teamId);
	const { data: availableUsersData, isLoading: isLoadingAvailable } =
		useAvailableUsers(teamId);

	const addMembersMutation = useAddMembers(teamId);
	const removeMemberMutation = useRemoveMember(teamId);
	const promoteMutation = usePromoteToAdmin(teamId);
	const demoteMutation = useDemoteFromAdmin(teamId);

	const members = membersData?.members || [];
	const availableUsers = availableUsersData?.users || [];

	const toggleUserSelection = (userId) => {
		setSelectedUsers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const handleUpdateTeam = async () => {
		if (selectedUsers.length === 0) {
			toast.error('Please select at least one user to add');
			return;
		}

		try {
			await addMembersMutation.mutateAsync(selectedUsers);
			setSelectedUsers([]);
		} catch (error) {
			// Error handled in hook
		}
	};

	const handleRemoveMember = async (member) => {
		if (member.isCreator) {
			toast.error('Cannot remove the team creator');
			return;
		}

		if (member.isAdmin) {
			toast.error('Cannot remove admin users. Remove admin privileges first.');
			return;
		}

		const confirmed = await confirm({
			header: 'Remove Team Member',
			description: `Are you sure you want to remove ${member.name} from this team?`,
			primaryCtaText: 'Remove',
			primaryCtaVariant: 'destructive',
		});

		if (confirmed) {
			removeMemberMutation.mutate(member.id);
		}
	};

	const handleMakeAdmin = (member) => {
		promoteMutation.mutate(member.id);
	};

	const handleRemoveAdmin = async (member) => {
		const adminCount = members.filter((m) => m.isAdmin).length;
		if (adminCount <= 1) {
			toast.error(
				'Cannot demote the only admin. Promote another member to admin first.',
			);
			return;
		}

		demoteMutation.mutate(member.id);
	};

	return (
		<>
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent
					side="right"
					className="p-0 max-w-[30rem] h-[100vh]"
					classBtnClass="!size-4"
				>
					<div className="h-full w-full relative">
						<SheetHeader className="p-6 pb-4">
							<SheetTitle className="text-base text-[#26064A] font-semibold">
								Manage Team Members -{' '}
								{membersData?.teamName ||
									team?.teamName ||
									team?.name}
							</SheetTitle>
						</SheetHeader>

						<div className="h-[calc(100%-9rem)] flex flex-col gap-4 border-t border-gray-300 py-3 overflow-hidden">
							{/* Current Members Box */}
							<div className="flex flex-col flex-1 max-h-[50%] overflow-hidden px-6">
								<div className="text-[#26064A] text-sm font-semibold mb-3">
									Current Members ({members.length})
								</div>

								<div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
									{isLoadingMembers ? (
										<div className="flex items-center justify-center p-8">
											<Loader2 className="size-6 animate-spin text-[#6A12CD]" />
										</div>
									) : members.length > 0 ? (
										members.map((user, index) => (
											<div
												key={user.id}
												className={`flex items-center gap-3 px-4 py-3 ${
													index !== members.length - 1
														? 'border-b border-gray-200'
														: ''
												}`}
											>
												<div className="flex-1 min-w-0 flex items-center justify-between gap-2">
													<div className="min-w-0 flex-1">
														<div className="text-[#26064A] font-medium text-sm truncate mb-0.5">
															{user.name}
														</div>
														<div className="flex items-center gap-2">
															<div className="text-gray-500 text-xs truncate">
																{user.email}
															</div>
															<div className="flex items-center gap-1.5 flex-wrap">
																{user.isCreator && (
																	<Badge
																		variant="secondary"
																		className="bg-[#6A12CD1A] text-[#6A12CD] hover:bg-[#6A12CD1A] text-[10px] px-1.5 py-2 h-6 font-medium"
																	>
																		Creator
																	</Badge>
																)}
																{user.isAdmin && (
																	<Badge
																		variant="secondary"
																		className="bg-[#6A12CD1A] text-[#6A12CD] hover:bg-[#6A12CD1A] text-[10px] px-1.5 py-2 h-6 font-medium"
																	>
																		Admin
																	</Badge>
																)}
															</div>
														</div>
													</div>

													{!user.isCreator && (
														<DropdownMenu>
															<DropdownMenuTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="icon"
																	className="size-8 h-8 w-8 p-0"
																>
																	<MoreVertical className="size-4 text-[#26064A]" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent
																align="end"
																className="w-40"
															>
																{user.isAdmin ? (
																	<DropdownMenuItem
																		onClick={() =>
																			handleRemoveAdmin(
																				user,
																			)
																		}
																	>
																		Remove Admin
																	</DropdownMenuItem>
																) : (
																	<DropdownMenuItem
																		onClick={() =>
																			handleMakeAdmin(
																				user,
																			)
																		}
																	>
																		Make Admin
																	</DropdownMenuItem>
																)}
																{!user.isAdmin && (
																	<DropdownMenuItem
																		onClick={() =>
																			handleRemoveMember(
																				user,
																			)
																		}
																		className="text-destructive focus:text-destructive"
																	>
																		Delete
																	</DropdownMenuItem>
																)}
															</DropdownMenuContent>
														</DropdownMenu>
													)}
												</div>
											</div>
										))
									) : (
										<div className="px-4 py-8 text-center text-gray-500 text-sm">
											No current members found
										</div>
									)}
								</div>
							</div>

							{/* Add New Members Box */}
							<div className="flex-1 max-h-[50%] flex flex-col overflow-hidden border-t border-[#6A12CD1A] px-6 pt-3">
								<div className="text-[#26064A] text-sm font-semibold mb-3">
									Add New Members ({availableUsers.length})
								</div>

								<div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
									{isLoadingAvailable ? (
										<div className="flex items-center justify-center p-8">
											<Loader2 className="size-6 animate-spin text-[#6A12CD]" />
										</div>
									) : availableUsers.length > 0 ? (
										availableUsers.map((user, index) => (
											<div
												key={user.id}
												className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
													index !==
													availableUsers.length - 1
														? 'border-b border-gray-200'
														: ''
												}`}
												onClick={() =>
													toggleUserSelection(user.id)
												}
											>
												<div
													className={`flex-shrink-0 size-5 rounded border-2 flex items-center justify-center transition-colors ${
														selectedUsers.includes(
															user.id,
														)
															? 'bg-[#6A12CD] border-[#6A12CD]'
															: 'border-gray-300 bg-white'
													}`}
												>
													{selectedUsers.includes(
														user.id,
													) && (
														<Check
															className="size-3 text-white"
															strokeWidth={3}
														/>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="text-[#26064A] font-medium text-sm truncate">
														{user.name}
													</div>
													<div className="text-gray-500 text-xs truncate">
														{user.email}
													</div>
												</div>
											</div>
										))
									) : (
										<div className="px-4 py-8 text-center text-gray-500 text-sm">
											No users available to add
										</div>
									)}
								</div>
							</div>
						</div>

						<div className="absolute bottom-0 left-0 w-full py-4 px-6 flex justify-between border-t border-[#6A12CD1A] bg-white">
							<Button
								className="ml-auto min-w-[100px]"
								onClick={handleUpdateTeam}
								disabled={
									selectedUsers.length === 0 ||
									addMembersMutation.isPending
								}
							>
								{addMembersMutation.isPending ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Updating...
									</>
								) : (
									'Update Team'
								)}
							</Button>
						</div>
					</div>
				</SheetContent>
			</Sheet>
			<ConfirmDialog />
		</>
	);
}
