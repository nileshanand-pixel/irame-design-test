import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MdDescription } from 'react-icons/md';
import {
	LuPencil,
	LuType,
	LuMove,
	LuMaximize2,
	LuTrash2,
	LuLightbulb,
} from 'react-icons/lu';
import { cn } from '@/lib/utils';

const EditModeActionItem = ({
	icon: Icon,
	title,
	description,
	iconBgColor = 'bg-[#FAF5FF]',
	iconColor = 'text-[#6A12CD]',
}) => {
	return (
		<div className="w-full justify-start items-start gap-3 rounded-lg h-auto">
			<div className="flex items-start gap-3">
				<div
					className={cn(
						'size-8 rounded-[0.625rem] flex items-center justify-center flex-shrink-0',
						iconBgColor,
					)}
				>
					<Icon className={cn('w-4', iconColor)} />
				</div>
				<div className="flex-1 text-left">
					<p className="text-sm font-medium text-[#26064A] mb-1">
						{title}
					</p>
					<p className="text-xs text-[#4A5565]">{description}</p>
				</div>
			</div>
		</div>
	);
};

// Action items configuration
const ACTION_ITEMS = [
	{
		id: 'rename',
		icon: LuType,
		title: 'Rename Board Title',
		description: 'Click Board title to edit',
		iconBgColor: 'bg-[#F3EDFB]',
		iconColor: 'text-[#6A12CD]',
		hoverBgColor: 'hover:bg-[#E0E7FF]',
		action: 'rename',
	},

	{
		id: 'rename',
		icon: MdDescription,
		title: 'Rename Board Description',
		description: 'Click Description to edit',
		iconBgColor: 'bg-[#F3EDFB]',
		iconColor: 'text-[#6A12CD]',
		hoverBgColor: 'hover:bg-[#E0E7FF]',
		action: 'rename',
	},
	/*
	// {
	// 	id: 'resize',
	// 	icon: LuMaximize2,
	// 	title: 'Resize Cards',
	// 	description: 'Adjust card size and ratio',
	// 	iconBgColor: 'bg-[#FAF5FF]',
	// 	iconColor: 'text-[#6A12CD]',
	// 	hoverBgColor: 'hover:bg-[#E0E7FF]',
	// 	action: null,
	// },
	 */
	{
		id: 'delete',
		icon: LuTrash2,
		title: 'Delete',
		description: 'Remove unwanted items',
		iconBgColor: 'bg-[#FEF2F2]',
		iconColor: 'text-[#EF4444]',
		hoverBgColor: 'hover:bg-red-50',
		action: 'delete',
	},
];

const EditModeModal = ({ isOpen, onClose }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in-0">
			<div
				className="bg-white rounded-[0.875rem] border-2 border-[#6A12CD] w-[23rem] overflow-hidden"
				style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
			>
				<div className="flex items-start justify-between p-4 border-b border-[#F3F4F6]">
					<div className="flex items-center gap-3">
						<div className="size-10 bg-[#F3EDFB] rounded-[0.625rem] flex items-center justify-center flex-shrink-0">
							<LuPencil className="size-5 text-[#6A12CD]" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="text-[#26064A]">Edit Mode Active</h3>
								<div className="size-2 bg-[#6A12CD] rounded-full"></div>
							</div>
							<p className="text-xs text-[#6A7282]">
								Hover cards to customize
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="size-6 text-gray-500 hover:text-gray-700 hover:bg-transparent"
					>
						<X className="size-5" />
					</Button>
				</div>

				<div className="p-4 space-y-3">
					{ACTION_ITEMS.map((item) => (
						<EditModeActionItem
							key={item.id}
							icon={item.icon}
							title={item.title}
							description={item.description}
							iconBgColor={item.iconBgColor}
							iconColor={item.iconColor}
						/>
					))}
				</div>

				<div className="flex items-center gap-1 px-4 py-3 bg-[#F9FAFB] border-t border-[#F3F4F6]">
					<LuLightbulb className="size-4 text-[#FBBF24] flex-shrink-0" />
					<p className="text-xs text-[#6A7282]">
						Tip: Delete confirmation prevents accidental removals
					</p>
				</div>
			</div>
		</div>
	);
};

export default EditModeModal;
