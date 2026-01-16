import React from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Lock } from 'lucide-react';

export default function GeneralAccess({ generalAccess = {} }) {
	return (
		<div className="flex flex-col gap-1">
			<label className="text-[rgba(38,6,74,0.4)] text-[11px] font-medium">
				General Access
			</label>
			<Select
				value={generalAccess.value}
				onValueChange={generalAccess.onChange}
			>
				<SelectTrigger className="w-full flex items-center justify-between border-none shadow-none text-[#26064a] font-medium p-0 h-auto focus:ring-0">
					<SelectValue>
						<div className="flex items-center gap-2">
							<span className="flex items-center justify-center">
								{generalAccess.options?.find(
									(opt) => opt.value === generalAccess.value,
								)?.icon || (
									<Lock className="h-4 w-4 text-[#26064a]" />
								)}
							</span>
							<span className="text-sm font-medium">
								{generalAccess.options?.find(
									(opt) => opt.value === generalAccess.value,
								)?.label || 'Restricted'}
							</span>
						</div>
					</SelectValue>
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
									{opt.icon || <Lock className="h-4 w-4" />}
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
	);
}
