import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import plusIconWhite from '@/assets/icons/user-plus-white.svg';
import deleteIcon from '@/assets/icons/delete.svg';

export default function ManageUsersDrawer({ open, setOpen, team }) {
	const [currentMembers, setCurrentMembers] = useState([]);
	const [availableUsers, setAvailableUsers] = useState([]);
	const [selectedUsers, setSelectedUsers] = useState([]);

	// Mock data - replace with actual API call
	useEffect(() => {
		// Mock current members (3 users)
		const mockCurrentMembers = [
			{ id: 1, name: 'Aarav Mehta', email: 'aarav.mehta@example.com' },
			{ id: 2, name: 'Rohan Patel', email: 'rohan.patel@example.com' },
			{ id: 3, name: 'Vikram Singh', email: 'vikram.singh@example.com' },
			{ id: 1, name: 'Aarav Mehta', email: 'aarav.mehta@example.com' },
			{ id: 2, name: 'Rohan Patel', email: 'rohan.patel@example.com' },
			{ id: 3, name: 'Vikram Singh', email: 'vikram.singh@example.com' },
			{ id: 1, name: 'Aarav Mehta', email: 'aarav.mehta@example.com' },
			{ id: 2, name: 'Rohan Patel', email: 'rohan.patel@example.com' },
			{ id: 3, name: 'Vikram Singh', email: 'vikram.singh@example.com' },
			{ id: 1, name: 'Aarav Mehta', email: 'aarav.mehta@example.com' },
			{ id: 2, name: 'Rohan Patel', email: 'rohan.patel@example.com' },
			{ id: 3, name: 'Vikram Singh', email: 'vikram.singh@example.com' },
		];

		// Mock available users to add
		const mockAvailableUsers = [
			{ id: 4, name: 'Nisha Verma', email: 'nisha.verma@example.com' },
			{ id: 5, name: 'Priya Joshi', email: 'priya.joshi@example.com' },
			{ id: 6, name: 'Anjali Rao', email: 'anjali.rao@example.com' },
			{ id: 7, name: 'Siddharth Kumar', email: 'siddharth.kumar@example.com' },
			{ id: 8, name: 'Karan Desai', email: 'karan.desai@example.com' },
			{ id: 9, name: 'Meera Sharma', email: 'meera.sharma@example.com' },
			{ id: 10, name: 'Arjun Gupta', email: 'arjun.gupta@example.com' },
			{ id: 11, name: 'Divya Reddy', email: 'divya.reddy@example.com' },
			{ id: 12, name: 'Rahul Iyer', email: 'rahul.iyer@example.com' },
			{ id: 13, name: 'Sneha Kapoor', email: 'sneha.kapoor@example.com' },
		];

		setCurrentMembers(mockCurrentMembers);
		setAvailableUsers(mockAvailableUsers);
	}, []);

	const toggleUserSelection = (userId) => {
		setSelectedUsers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent
				side="right"
				className="p-0 max-w-[30rem] h-[100vh]"
				classBtnClass="!size-4"
			>
				<div className="h-full w-full relative">
					<SheetHeader className="p-6 pb-4">
						<SheetTitle className="text-base text-[#26064A] font-semibold">
							Manage Team Members
						</SheetTitle>
					</SheetHeader>

					<div className="h-[calc(100%-9rem)] flex flex-col gap-4  border-t border-gray-300 py-3">
						{/* Current Members Box */}
						<div className="flex flex-col flex-1 max-h-[50%] overflow-hidden px-6">
							<div className="text-[#26064A] text-sm font-semibold mb-3">
								Current Members ({currentMembers.length})
							</div>

							<div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
								{currentMembers.length > 0 ? (
									currentMembers.map((user, index) => (
										<div
											key={user.id}
											className={`flex items-center gap-3 px-4 py-3 ${
												index !== currentMembers.length - 1
													? 'border-b border-gray-200'
													: ''
											}`}
										>
											<div className="flex-1 min-w-0 flex items-center justify-between">
												<div>
													<div className="text-[#26064A] font-medium text-sm truncate">
														{user.name}
													</div>
													<div className="text-gray-500 text-xs truncate">
														{user.email}
													</div>
												</div>

												<Button
													variant="ghost"
													className="gap-1 items-center"
												>
													<img
														src={deleteIcon}
														className="size-4"
													/>
													<span className="text-sm text-[#26064A] font-normal">
														Remove
													</span>
												</Button>
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
								{availableUsers.length > 0 ? (
									availableUsers.map((user, index) => (
										<div
											key={user.id}
											className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
												index !== availableUsers.length - 1
													? 'border-b border-gray-200'
													: ''
											}`}
											onClick={() =>
												toggleUserSelection(user.id)
											}
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

					<div className="absolute bottom-0 left-0 w-full py-4 px-6 flex justify-between border-t border-[#6A12CD1A]">
						<Button
							className="gap-2 px-3 rounded-lg"
							onClick={() => {}}
							size="lg"
						>
							<img src={plusIconWhite} className="size-5" />
							Invite User
						</Button>
						<Button>Create Team</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
