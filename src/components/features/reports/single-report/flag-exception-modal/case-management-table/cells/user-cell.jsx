import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export default function UserCell({ value }) {
	return (
		<div className="flex items-center gap-2">
			<Avatar className="size-6">
				<AvatarFallback
					className="text-[#26064A] text-xs font-medium"
					style={{
						background:
							'linear-gradient(0deg, rgba(30, 64, 175, 0.10) 0%, rgba(30, 64, 175, 0.10) 100%), #FFF',
					}}
				>
					{getInitials(value)}
				</AvatarFallback>
			</Avatar>
			<span className="text-sm text-[#6B7280] whitespace-nowrap">{value}</span>
		</div>
	);
}
