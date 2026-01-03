import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getInitials } from '@/lib/utils';

export default function UsersCell({ value }) {
	if (value?.length === 0) {
		return <span className="text-sm text-[#6B7280]">Not Assigned</span>;
	}

	return (
		<div className="flex items-center -space-x-2">
			{value?.slice(0, 2).map((user, i) => (
				<Avatar
					key={user.user_id || i}
					className="size-8 border-2 border-white"
					title={user?.name}
				>
					<AvatarFallback
						className="text-[#26064A] text-xs font-medium"
						style={{
							background:
								'linear-gradient(0deg, rgba(30, 64, 175, 0.10) 0%, rgba(30, 64, 175, 0.10) 100%), #FFF',
						}}
					>
						{getInitials(user.name)}
					</AvatarFallback>
				</Avatar>
			))}
			{value?.length > 2 && (
				<Popover modal={true}>
					<PopoverTrigger asChild>
						<Avatar className="size-8 border-2 border-white cursor-pointer hover:scale-110 transition-transform">
							<AvatarFallback
								className="text-[#26064A] text-xs font-medium"
								style={{
									background:
										'linear-gradient(0deg, rgba(30, 64, 175, 0.10) 0%, rgba(30, 64, 175, 0.10) 100%), #FFF',
								}}
							>
								+{value.length - 2}
							</AvatarFallback>
						</Avatar>
					</PopoverTrigger>
					<PopoverContent className="w-64 p-0" align="center">
						<div className="flex flex-col">
							<p className="text-sm font-semibold text-[#26064A] p-3 pb-2 border-b z-10">
								Assigned to ({value.length})
							</p>
							<div className="max-h-[18rem] overflow-auto p-3 pt-2 space-y-2">
								{value?.map((user, i) => (
									<div
										key={user.user_id || i}
										className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
									>
										<Avatar className="size-8 shrink-0">
											<AvatarFallback
												className="text-[#26064A] text-xs font-medium"
												style={{
													background:
														'linear-gradient(0deg, rgba(30, 64, 175, 0.10) 0%, rgba(30, 64, 175, 0.10) 100%), #FFF',
												}}
											>
												{getInitials(user.name)}
											</AvatarFallback>
										</Avatar>
										<span className="text-sm text-[#26064A] font-medium">
											{user.name}
										</span>
									</div>
								))}
							</div>
						</div>
					</PopoverContent>
				</Popover>
			)}
		</div>
	);
}
