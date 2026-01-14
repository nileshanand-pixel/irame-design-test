import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ShareButton({ onClick, className, ...props }) {
	return (
		<Button
			onClick={onClick}
			variant="outline"
			className={cn(
				'bg-white/20 hover:bg-white/40 border-[#26064a]/10 text-[#26064a]/80 gap-2 h-9 px-3 rounded-lg font-medium',
				className,
			)}
			{...props}
		>
			<Share2 className="w-4 h-4" />
			Share
		</Button>
	);
}
