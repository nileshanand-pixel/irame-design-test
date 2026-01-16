import React, { useRef, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';

export default function InviteSection({ invite = {} }) {
	const [showSuggestions, setShowSuggestions] = useState(false);
	const inputRef = useRef(null);
	const suggestionsRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				inputRef.current &&
				!inputRef.current.contains(event.target) &&
				suggestionsRef.current &&
				!suggestionsRef.current.contains(event.target)
			) {
				setShowSuggestions(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<div className="min-h-[38px] w-full pl-3 pr-3 py-1.5 text-sm border-0 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] ring-1 ring-inset ring-[rgba(0,0,0,0.08)] rounded-md flex flex-wrap gap-1.5 items-center focus-within:ring-[#6a12cd]">
						{invite.selectedUsers?.map((user) => (
							<div
								key={user.userId}
								className="inline-flex items-center gap-1.5 bg-[#f3f4f6] text-[#26064a] text-sm px-2 py-1 rounded-md"
							>
								<Avatar className="h-4 w-4">
									<AvatarImage src={user.avatar} />
									<AvatarFallback className="text-purple-700 text-[10px]">
										{user.name?.[0] || user.email?.[0]}
									</AvatarFallback>
								</Avatar>
								<span className="font-medium">
									{user.name || user.email}
								</span>
								<button
									type="button"
									onClick={() =>
										invite.onUserRemove?.(user.userId)
									}
									className="hover:bg-gray-300 rounded-sm p-0.5"
								>
									<X className="h-3 w-3" />
								</button>
							</div>
						))}

						<input
							ref={inputRef}
							type="text"
							placeholder={
								invite.selectedUsers?.length > 0
									? ''
									: invite.placeholder || 'Search by name or email'
							}
							className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-[rgba(0,0,0,0.4)] text-sm"
							value={invite.searchQuery || ''}
							onChange={(e) => invite.onSearchChange?.(e.target.value)}
							onFocus={() => setShowSuggestions(true)}
							disabled={invite.selectedUsers?.length >= 3}
						/>
					</div>

					{showSuggestions &&
						invite.searchQuery &&
						invite.searchQuery.length > 0 && (
							<div
								ref={suggestionsRef}
								className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto"
							>
								{invite.isSearching ? (
									<div className="flex items-center justify-center py-4">
										<Loader2 className="h-4 w-4 animate-spin text-gray-400" />
									</div>
								) : invite.suggestions?.length > 0 ? (
									<div className="py-1">
										<div className="px-3 py-1.5 text-xs font-medium text-gray-500">
											Suggested
										</div>
										{invite.suggestions.map((user) => (
											<button
												key={user.userId}
												type="button"
												className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
												onClick={() => {
													invite.onUserSelect?.(user);
													setShowSuggestions(false);
												}}
											>
												<Avatar className="h-8 w-8">
													<AvatarImage src={user.avatar} />
													<AvatarFallback className="text-purple-700">
														{user.name?.[0] ||
															user.email?.[0]}
													</AvatarFallback>
												</Avatar>
												<div className="flex flex-col items-start text-left">
													<span className="text-sm font-medium text-[#26064a]">
														{user.name || 'Unknown User'}
													</span>
													<span className="text-xs text-gray-500">
														{user.email}
													</span>
												</div>
											</button>
										))}
									</div>
								) : (
									<div className="py-4 text-center text-sm text-gray-500">
										No users found
									</div>
								)}
							</div>
						)}
				</div>

				{invite.accessLevelOptions && invite.selectedUsers?.length > 0 && (
					<div className="animate-in fade-in slide-in-from-right-2 duration-300 ease-in-out">
						<Select
							value={invite.accessLevel || 'viewer'}
							onValueChange={invite.onAccessLevelChange}
						>
							<SelectTrigger className="w-auto h-auto border-none shadow-none bg-transparent hover:bg-gray-50 focus:ring-0 gap-1 px-2 py-3 text-[#26064a] text-sm font-normal">
								<SelectValue>
									{
										(
											invite.accessLevelOptions.find(
												(opt) =>
													opt.value ===
													(invite.accessLevel || 'viewer'),
											) || {}
										).label
									}
								</SelectValue>
							</SelectTrigger>
							<SelectContent align="end" className="w-[280px]">
								{invite.accessLevelOptions.map((opt) => (
									<SelectItem
										key={opt.value}
										value={opt.value}
										textValue={opt.label}
										className="py-2.5"
									>
										<div className="flex flex-col items-start gap-0.5">
											<span className="font-medium text-sm text-[#26064a]">
												{opt.label}
											</span>
											{opt.description && (
												<span className="text-[rgba(38,6,74,0.6)] text-xs font-normal">
													{opt.description}
												</span>
											)}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			{invite.selectedUsers?.length >= 3 && (
				<p className="text-xs text-amber-600">
					Maximum 3 users can be invited at once
				</p>
			)}
		</div>
	);
}
