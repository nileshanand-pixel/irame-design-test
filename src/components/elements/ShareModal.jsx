import React, { useMemo } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SelectSeparator,
} from '@/components/ui/select';
import {
	UserPlus,
	Link as LinkIcon,
	ChevronDown,
	Lock,
	Globe,
	Trash2,
	Copy,
	Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function ShareModal({ open, onOpenChange, config, ...restProps }) {
	const [inputValue, setInputValue] = React.useState('');

	const finalConfig = useMemo(() => {
		if (config) return config;

		// Direct props bridge for backward compatibility
		return {
			title: restProps.title || 'Share this file',
			icon: restProps.icon,
			invite: {
				placeholder: restProps.invitePlaceholder || 'Email, Team & Users',
				buttonText: restProps.inviteButtonText || 'Invite',
				onInvite: restProps.onInvite,
				value: restProps.inviteValue,
				onInputChange: restProps.onInviteInputChange,
			},
			members: (restProps.members || []).map((m) => ({
				...m,
				role: m.role || 'view',
				options: m.options || [
					{
						label: 'Full Access',
						value: 'admin',
						description: 'Edit, comment, and share with others',
					},
					{
						label: 'Can Edit',
						value: 'edit',
						description: 'Edit, comment, and share with others',
					},
					{
						label: 'Can Comment & View',
						value: 'view',
						description: 'Comment & View only',
					},
					{ label: 'Remove', value: 'remove', isDanger: true },
				],
			})),
			generalAccess: restProps.generalAccess || {
				value: 'restricted',
				icon: <Lock className="h-4 w-4 text-gray-500" />,
				options: [
					{
						label: 'Only Invited Users',
						value: 'restricted',
						icon: <Lock className="h-4 w-4 text-gray-500" />,
					},
				],
			},
			footer: {
				link: restProps.link || restProps.shareLink || window.location.href,
				onCopy: restProps.onCopyLink || restProps.onCopy,
			},
		};
	}, [config, restProps]);

	const {
		title,
		icon,
		invite = {},
		members = [],
		generalAccess = {},
		footer = {},
	} = finalConfig;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[26rem] p-0 gap-0 overflow-hidden rounded-xl border-[#e9eaeb] shadow-2xl">
				{/* Header */}
				<div className="border-b border-[#e9eaeb] px-5 py-3 flex items-center gap-3 bg-white">
					<div className="bg-[#f4ebff] border-[4px] border-[#f9f5ff] rounded-full p-1.5 shrink-0">
						{icon || <UserPlus className="h-4 w-4 text-[#6a12cd]" />}
					</div>
					<DialogTitle className="text-[#26064a] text-base font-medium">
						{title}
					</DialogTitle>
				</div>

				{/* Body */}
				<div className="p-4 flex flex-col gap-5 bg-white">
					{/* Invite Section */}
					<div className="flex gap-3">
						<div className="relative flex-1">
							<Input
								placeholder={
									invite.placeholder || 'Email, Team & Users'
								}
								className="w-full pl-3 pr-3 py-2 text-sm border-0 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] ring-1 ring-inset ring-[rgba(0,0,0,0.08)] placeholder:text-[rgba(0,0,0,0.4)] focus-visible:ring-[#6a12cd]"
								value={
									invite.value !== undefined
										? invite.value
										: inputValue
								}
								onChange={(e) => {
									setInputValue(e.target.value);
									if (invite.onInputChange)
										invite.onInputChange(e.target.value);
								}}
							/>
						</div>
						<Button
							className="bg-[#6a12cd] hover:bg-[#5b0fb3] text-white font-medium px-4 py-2 h-auto"
							onClick={() => {
								invite.onInvite &&
									invite.onInvite(
										invite.value !== undefined
											? invite.value
											: inputValue,
									);
								if (invite.value === undefined) setInputValue('');
							}}
						>
							{invite.buttonText || 'Invite'}
						</Button>
					</div>

					{/* Members List */}
					<div className="flex flex-col gap-3">
						{members.map((member, index) => (
							<div key={index} className="flex items-center gap-3">
								<Avatar className="h-9 w-9">
									<AvatarImage src={member.avatar} />
									<AvatarFallback className="bg-purple-100 text-purple-700">
										{member.name?.[0] || member.email?.[0]}
									</AvatarFallback>
								</Avatar>

								<div className="flex flex-col flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-[#26064a] text-sm font-medium truncate">
											{member.name || member.email}
										</span>
									</div>
									<span className="text-[rgba(38,6,74,0.6)] text-xs truncate">
										{member.email}
									</span>
								</div>

								{member.isOwner ? (
									<div className="bg-[#f0f1f1] text-[#637083] text-[10px] px-2 py-0.5 rounded font-medium">
										Owner
									</div>
								) : (
									<Select
										value={member.role}
										onValueChange={(val) =>
											member.onRoleChange &&
											member.onRoleChange(val)
										}
									>
										<SelectTrigger className="w-auto h-auto border-none shadow-none bg-transparent hover:bg-gray-50 focus:ring-0 gap-1 px-2 py-1.5 text-[#26064a] text-sm font-normal">
											<SelectValue placeholder="Access" />
										</SelectTrigger>
										<SelectContent
											align="end"
											className="w-[280px]"
										>
											{(member.options || []).map(
												(opt, optIndex) => (
													<React.Fragment key={opt.value}>
														{opt.isDanger &&
															optIndex > 0 && (
																<SelectSeparator />
															)}
														<SelectItem
															value={opt.value}
															className={cn(
																'py-2.5',
																opt.isDanger &&
																	'text-red-600 focus:text-red-600 focus:bg-red-50',
															)}
														>
															<div className="flex flex-col items-start gap-0.5">
																<span
																	className={cn(
																		'font-medium text-sm',
																		!opt.isDanger &&
																			'text-[#26064a]',
																	)}
																>
																	{opt.label}
																</span>
																{opt.description && (
																	<span className="text-[rgba(38,6,74,0.6)] text-xs font-normal">
																		{
																			opt.description
																		}
																	</span>
																)}
															</div>
														</SelectItem>
													</React.Fragment>
												),
											)}
										</SelectContent>
									</Select>
								)}
							</div>
						))}
					</div>

					{/* General Access */}
					<div className="flex flex-col gap-1">
						<label className="text-[rgba(38,6,74,0.4)] text-[11px] font-medium">
							General Access
						</label>
						<Select
							value={generalAccess.value}
							onValueChange={generalAccess.onChange}
						>
							<SelectTrigger className="w-full flex items-center justify-between border-none shadow-none text-[#26064a] font-medium p-0 h-auto focus:ring-0">
								<div className="flex items-center gap-2">
									<span className="flex items-center justify-center">
										{generalAccess.options?.find(
											(opt) =>
												opt.value === generalAccess.value,
										)?.icon || (
											<Lock className="h-4 w-4 text-[#26064a]" />
										)}
									</span>
									<span className="text-sm font-medium">
										{generalAccess.options?.find(
											(opt) =>
												opt.value === generalAccess.value,
										)?.label || 'Restricted'}
									</span>
								</div>
							</SelectTrigger>
							<SelectContent className="w-[var(--radix-select-trigger-width)]">
								{(generalAccess.options || []).map((opt) => (
									<SelectItem
										key={opt.value}
										value={opt.value}
										className="py-2.5"
									>
										<div className="flex items-center gap-2 text-left">
											<span className="shrink-0 p-1.5 bg-gray-50 rounded-full">
												{opt.icon || (
													<Lock className="h-4 w-4" />
												)}
											</span>
											<div className="flex flex-col items-start translate-y-[1px]">
												<span className="text-sm font-medium text-[#26064a]">
													{opt.label}
												</span>
												{opt.description && (
													<span className="text-xs text-muted-foreground">
														{opt.description}
													</span>
												)}
											</div>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Footer */}
				<div className="bg-white border-t border-[#e9eaeb] px-5 py-4 flex items-center justify-between">
					{/* <div className="flex items-center gap-2 overflow-hidden flex-1 mr-4">
             <span className="text-[#26064a] text-sm truncate px-0 py-1 w-full font-normal opacity-70">
               {footer.link?.replace(/^https?:\/\//, '')}
             </span>
           </div> */}

					<Button
						variant="ghost"
						className="gap-2 text-[#6a12cd] hover:text-[#5b0fb3] hover:bg-purple-50 font-semibold text-sm h-auto py-1 px-2"
						onClick={footer.onCopy}
					>
						<LinkIcon className="h-3.5 w-3.5" />
						Copy Link
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
