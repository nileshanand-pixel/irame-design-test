import InputText from '@/components/elements/InputText';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState, useMemo } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsers } from '@/hooks/use-users';
import { createTeam } from '@/api/gatekeeper/team.service';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateTeamDrawer({ open, setOpen }) {
	const queryClient = useQueryClient();
	const [teamName, setTeamName] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { data: usersData, isLoading: usersLoading } = useUsers({
		type: 'active',
		status: 'active',
		limit: 100, // Fetch all active users for selection
	});

	const users = useMemo(() => {
		if (!usersData?.success || !usersData?.data) return [];
		return usersData.data.map((user) => ({
			id: user.userId,
			name: user.name || user.email,
			email: user.email,
		}));
	}, [usersData]);

	const toggleUserSelection = (userId) => {
		setSelectedUsers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const filteredUsers = useMemo(() => {
		return users.filter(
			(user) =>
				user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [users, searchQuery]);

	const handleCreateTeam = async () => {
		if (!teamName.trim()) {
			toast.error('Team name is required');
			return;
		}

		setIsSubmitting(true);
		try {
			await createTeam({
				name: teamName.trim(),
				memberIds: selectedUsers,
			});
			toast.success('Team created successfully');
			queryClient.invalidateQueries(['teams']);
			setOpen(false);
			// Reset form
			setTeamName('');
			setSelectedUsers([]);
		} catch (error) {
			console.error('Error creating team:', error);
			toast.error(error?.response?.data?.message || 'Failed to create team');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent
				side="right"
				className="p-0 max-w-[30rem] h-[100vh]"
				classBtnClass="!size-4"
			>
				<SheetHeader className="p-6 pb-4">
					<SheetTitle className="text-base text-[#26064A] font-semibold">
						Create New Team
					</SheetTitle>
				</SheetHeader>

				<div className="border-y border-[#6A12CD1A] pt-4 px-6 pb-5">
					<InputText
						label="Team Name"
						placeholder="Enter unique team name"
						className="w-full"
						value={teamName}
						setValue={(e) => setTeamName(e)}
						required={true}
					/>
				</div>

				<div className="py-4 px-6">
					<div className="mb-2">
						<div className="text-[#26064A] text-base font-semibold">
							Add Team Members
						</div>
						<div className="text-[#26064A] text-xs">
							Select users to add to this team. You can add more
							members later.
						</div>
					</div>

					<div className="relative">
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
						<input
							type="text"
							placeholder="Search Users by name & email"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400"
						/>
					</div>
				</div>

				<div className="px-6 h-[calc(100vh-22.5rem)] overflow-auto pb-3">
					<div className="border border-gray-200 rounded-lg">
						{usersLoading ? (
							<div className="px-4 py-8 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
								<Loader2 className="size-4 animate-spin" />
								Loading users...
							</div>
						) : filteredUsers.length > 0 ? (
							filteredUsers.map((user, index) => (
								<div
									key={user.id}
									className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
										index !== filteredUsers.length - 1
											? 'border-b border-gray-200'
											: ''
									}`}
									onClick={() => toggleUserSelection(user.id)}
								>
									<div
										className={`flex-shrink-0 size-5 rounded border-2 flex items-center justify-center transition-colors ${
											selectedUsers.includes(user.id)
												? 'bg-[#6A12CD] border-[#6A12CD]'
												: 'border-gray-300 bg-white'
										}`}
									>
										{selectedUsers.includes(user.id) && (
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
											@{user.email}
										</div>
									</div>
								</div>
							))
						) : (
							<div className="px-4 py-8 text-center text-gray-500 text-sm">
								No users found
							</div>
						)}
					</div>
				</div>

				<div className="py-4 px-6 flex justify-end border-t border-[#6A12CD1A]">
					<Button onClick={handleCreateTeam} disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Creating...
							</>
						) : (
							'Create Team'
						)}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
