import React from 'react';
import { DialogTitle } from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';

export default function Header({ title, icon }) {
	return (
		<div className="border-b border-[#e9eaeb] px-5 py-3 flex items-center gap-3 bg-white">
			<div className="bg-[#f4ebff] border-[4px] border-[#f9f5ff] rounded-full p-1.5 shrink-0">
				{icon || <UserPlus className="h-4 w-4 text-[#6a12cd]" />}
			</div>
			<DialogTitle className="text-[#26064a] text-base font-medium">
				{title}
			</DialogTitle>
		</div>
	);
}
