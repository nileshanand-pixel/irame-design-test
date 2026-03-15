import React from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GeneralAccess({ generalAccess = {} }) {
	return (
		<div className="flex flex-col gap-1">
			<label className="text-[rgba(38,6,74,0.4)] text-[11px] font-medium">
				General Access
			</label>
			<Select
				value={generalAccess.value}
				onValueChange={generalAccess.onChange}
				disabled={generalAccess.disabled}
			>
				<SelectTrigger className="w-full flex items-center justify-between border-none shadow-none text-[#26064a] font-medium p-0 h-auto focus:ring-0">
					<SelectValue>
						<div className="flex items-center gap-2">
							<span className="flex items-center justify-center">
								{generalAccess.options?.find(
									(opt) => opt.value === generalAccess.value,
								)?.icon || (
									<Lock className="h-4 w-4 text-primary80" />
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
				<SelectContent
					className={cn(
						'rounded-[0.625rem] border border-[#E5E7EB] bg-white shadow-md p-0 overflow-hidden',
						'w-[var(--radix-select-trigger-width)]',
					)}
				>
					{(generalAccess.options || []).map((opt) => {
						const isSelected = opt.value === generalAccess.value;
						return (
							<SelectItem
								key={opt.value}
								value={opt.value}
								className={cn(
									'cursor-pointer text-sm px-4 py-3 outline-none',
									'hover:bg-[rgba(106,18,205,0.08)] focus:bg-[rgba(106,18,205,0.08)] data-[highlighted]:bg-[rgba(106,18,205,0.08)]',
								)}
							>
								<div className="flex items-center gap-2 text-left">
									<span className="shrink-0 p-1.5 rounded-full text-primary80">
										{opt.icon || <Lock className="h-4 w-4" />}
									</span>
									<div className="flex flex-col items-start translate-y-[1px]">
										<span
											className={cn(
												'text-sm font-medium',
												isSelected
													? 'text-purple-100'
													: 'text-[#26064a]',
											)}
										>
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
						);
					})}
				</SelectContent>
			</Select>
		</div>
	);
}
