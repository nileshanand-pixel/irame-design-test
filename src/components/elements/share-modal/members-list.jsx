import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SelectSeparator,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function MembersList({ members = [] }) {
	return (
		<div className="flex flex-col gap-3">
			{members.map((member, index) => (
				<div key={index} className="flex items-center gap-3">
					<Avatar className="h-9 w-9">
						<AvatarImage src={member.avatar} />
						<AvatarFallback className=" text-purple-700">
							{member.name?.[0] || member.email?.[0]}
						</AvatarFallback>
					</Avatar>

					<div className="flex flex-col flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<span className="text-[#26064a] text-sm font-medium truncate">
								{member.name || member.email}
							</span>
							{member.isOwner && (
								<span className=" bg-purple-4 text-black/60 text-[10px] px-2 py-1 rounded font-medium">
									Owner
								</span>
							)}
						</div>
						<span className="text-[rgba(38,6,74,0.6)] text-xs truncate">
							{member.email}
						</span>
					</div>

					{member.isOwner ? (
						<Select
							value={member.role || 'owner'}
							onValueChange={() => {}}
						>
							<SelectTrigger
								disabled
								className="w-auto h-auto border-none shadow-none bg-transparent hover:bg-transparent focus:ring-0 gap-1 px-2 py-1.5 text-[#26064a] text-sm font-normal"
							>
								<SelectValue placeholder="Access">
									{(member.options || []).find(
										(opt) => opt.value === member.role,
									)?.label || 'Full Access'}
								</SelectValue>
							</SelectTrigger>
						</Select>
					) : (
						<Select
							value={member.role}
							onValueChange={(val) =>
								member.onRoleChange && member.onRoleChange(val)
							}
						>
							<SelectTrigger className="w-auto h-auto border-none shadow-none bg-transparent hover:bg-gray-50 focus:ring-0 gap-1 px-2 py-1.5 text-[#26064a] text-sm font-normal">
								<SelectValue placeholder="Access">
									{
										(
											member.options?.find(
												(opt) => opt.value === member.role,
											) || {}
										).label
									}
								</SelectValue>
							</SelectTrigger>
							<SelectContent
								align="end"
								className={cn(
									'rounded-[0.625rem] border border-[#E5E7EB] bg-white shadow-md p-0 overflow-hidden',
									'w-[280px]',
								)}
							>
								{(member.options || []).map((opt, optIndex) => {
									const isSelected = opt.value === member.role;
									return (
										<React.Fragment key={opt.value}>
											{opt.isDanger && optIndex > 0 && (
												<SelectSeparator className="my-0 py-0" />
											)}
											<SelectItem
												value={opt.value}
												textValue={opt.label}
												className={cn(
													'cursor-pointer text-sm px-4 py-3 outline-none',
													opt.isDanger
														? 'text-red-600 focus:text-red-600 focus:bg-red-50 py-4'
														: 'hover:bg-[rgba(106,18,205,0.08)] focus:bg-[rgba(106,18,205,0.08)] data-[highlighted]:bg-[rgba(106,18,205,0.08)]',
												)}
											>
												<div className="flex flex-col items-start gap-0.5">
													<span
														className={cn(
															'font-medium text-sm',
															isSelected
																? 'text-purple-100'
																: !opt.isDanger &&
																		'text-[#26064a]',
														)}
													>
														{opt.label}
													</span>
													{opt.description && (
														<span
															className={cn(
																'text-[rgba(38,6,74,0.6)]',
																'text-xs font-normal',
															)}
														>
															{opt.description}
														</span>
													)}
												</div>
											</SelectItem>
										</React.Fragment>
									);
								})}
							</SelectContent>
						</Select>
					)}
				</div>
			))}
		</div>
	);
}
