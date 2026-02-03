import React, { useMemo, useCallback, useEffect, memo, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from '@/components/ui/select';
import {
	ArrowRight,
	Calendar,
	Check,
	ChevronDown,
	Clock,
	File,
	Paperclip,
	Search,
	X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from '@/hooks/useRouter';
import useAuth from '@/hooks/useAuth';
import { useReportPermission } from '@/contexts/ReportPermissionContext';
import {
	getResolutionTrail,
	updateCaseData,
	getCaseDetails,
} from '@/components/features/reports/service/resolution-trail.service';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { toast } from '@/lib/toast';
import { queryClient } from '@/lib/react-query';
import { useFormState } from './hooks/useFormState';
import { getShareableUsers } from '@/api/share.service';
import { openFile } from '@/utils/file-opening';
import { extractFileName } from '@/utils/filename';
import {
	STATUS_OPTIONS,
	ACTION_OPTIONS,
	SEVERITY_OPTIONS,
	triggerBase,
	selectContentBase,
	selectItemBase,
	STATUS_MAP_TO_UI,
	SEVERITY_MAP_TO_UI,
	ACTION_MAP_TO_UI,
} from './constants/resolution-trail.constants';
import { useFileUploadsV2 } from '@/hooks/useFileUploadsV2';
import useS3File from '@/hooks/useS3File';
import FilePreview from '@/components/elements/file-preview';
import { Mention, MentionsInput } from 'react-mentions';
import { mentionsInputStyle, mentionStyle } from './mentionStyles';
import {
	validateFiles,
	getAcceptString,
	UPLOAD_CONTEXTS,
} from '@/config/file-upload.config';
import { useCommentRendering } from './hooks/useCommentRendering';
import Flag, {
	FLAG_CONFIG,
	FLAG_TYPES,
} from './single-report/flag-exception-modal/flag';
import { fileTypeFromBlob } from 'file-type';

/* ================================================================
   SMALL INLINE COMPONENTS
   ================================================================ */

function FormField({ label, required, children, className, disabled }) {
	return (
		<div className={cn(' flex flex-col gap-1', className)}>
			<Label className="text-xs font-medium text-primary60">
				{label}
				{required && <span className="ml-0.5 text-red-500">*</span>}
			</Label>
			<div className="relative">
				{disabled && (
					<div className="absolute top-0 left-0 w-full h-full bg-gray-100/50 rounded-md cursor-not-allowed z-10"></div>
				)}
				{children}
			</div>
		</div>
	);
}

function Pill({ label, dotClass, bgClass, textClass, borderClass }) {
	return (
		<div
			className={cn(
				'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
				bgClass,
				textClass,
				borderClass,
			)}
		>
			<span className={cn('w-2 h-2 rounded-full shrink-0', dotClass)} />
			<span>{label}</span>
		</div>
	);
}

function FlaggedByPill({ initials, name }) {
	return (
		<div className="flex items-center gap-1.5 pl-1 py-1 pr-2 rounded-full bg-purple-10 text-xs">
			<span
				className="
                    w-7 h-7 rounded-full
                    bg-purple-80 text-white
                    flex items-center justify-center
                    text-xs font-normal leading-none
                    select-none
                "
			>
				{initials}
			</span>
			<span className="text-primary80">{name}</span>
		</div>
	);
}

function DotOption({ color, label }) {
	return (
		<div className="flex w-full items-center gap-2 p-2 text-sm text-primary80">
			<span className={`w-2.5 h-2.5 rounded-full ${color}`} />
			<span>{label}</span>
		</div>
	);
}

function TimelineFile({ fileName, fileUrl }) {
	const { isOpening, openS3File } = useS3File();

	const handleClick = useCallback(() => {
		openFile(fileUrl, openS3File, {
			fileName,
			onError: (error) => {
				console.warn(error);
				toast.error('File URL not available');
			},
		});
	}, [fileUrl, openS3File, fileName]);

	return (
		<div
			className={cn(
				'inline-flex items-center px-2 py-1 border rounded-md text-xs bg-[#5B95FF29] border-[#5B95FF33] text-primary80',
				fileUrl && 'cursor-pointer hover:bg-[#5B95FF40] transition-colors',
			)}
			onClick={handleClick}
			role="button"
			tabIndex={fileUrl ? 0 : -1}
			onKeyDown={(e) => {
				if (fileUrl && (e.key === 'Enter' || e.key === ' ')) {
					e.preventDefault();
					handleClick();
				}
			}}
		>
			<File className="w-3 h-3 mr-1" />
			{isOpening ? 'Opening...' : fileName}
		</div>
	);
}

function PillSelect({ value, onChange, options, placeholder }) {
	const selected = value ? options[value] : null;

	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className={triggerBase}>
				{selected ? (
					<Pill {...selected} />
				) : (
					<span className="text-primary60">{placeholder}</span>
				)}
			</SelectTrigger>

			<SelectContent className={selectContentBase}>
				{Object.entries(options).map(([key, opt]) => (
					<SelectItem key={key} value={key} className={selectItemBase}>
						<DotOption color={opt.dotClass} label={opt.label} />
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function DatePicker({ value, onChange }) {
	const today = useMemo(() => {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	}, []);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<div className="relative">
					<Input
						readOnly
						value={value?.toLocaleDateString() || ''}
						placeholder="DD-MM-YYYY"
						className="h-12 cursor-pointer pr-10"
					/>
					<Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary80 pointer-events-none" />
				</div>
			</PopoverTrigger>

			<PopoverContent className="p-0 z-20">
				<ShadcnCalendar
					mode="single"
					selected={value}
					onSelect={onChange}
					className="border shadow-lg rounded-2xl bg-white"
					modifiers={{
						past: (date) => date < today,
					}}
					modifiersClassNames={{
						past: 'text-primary40 opacity-50 pointer-events-none',
					}}
					classNames={{
						day_selected:
							'bg-primary text-white rounded-md hover:bg-primary hover:text-white',
						day_today: 'border border-primary text-primary rounded-md',
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}

function AssignedToPill({ user, name, email, onRemove }) {
	const person = user || (name ? { name, email } : null);

	const displayName = person?.name || 'Unknown';
	const initials = displayName
		.split(' ')
		.map((part) => part[0] || '')
		.join('')
		.slice(0, 2)
		.toUpperCase();

	return (
		<div className="flex items-center gap-1.5 pl-1 py-1 pr-2.5 rounded-full bg-pill-user-bg text-xs shrink-0">
			<span className="w-7 h-7 rounded-full bg-pill-user-avatar text-primary80 flex items-center justify-center text-xs leading-none select-none shrink-0">
				{initials}
			</span>

			<span
				className="text-primary80 max-w-[6rem] truncate whitespace-nowrap"
				title={displayName}
			>
				{displayName}
			</span>

			{onRemove && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onRemove?.(person);
					}}
					className="text-primary60 hover:text-primary80 shrink-0"
				>
					<X className="w-4 h-4" />
				</button>
			)}
		</div>
	);
}

function AssignedToDropdown({ users, selected, setSelected }) {
	const [query, setQuery] = React.useState('');

	const filteredUsers = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return users;

		return users.filter(
			(u) =>
				u.name.toLowerCase().includes(q) ||
				u.email.toLowerCase().includes(q),
		);
	}, [users, query]);

	const isSelected = useCallback(
		(email) => selected.some((u) => u.email === email),
		[selected],
	);

	const toggleUser = useCallback(
		(user) => {
			setSelected((prev) =>
				isSelected(user.email)
					? prev.filter((u) => u.email !== user.email)
					: [...prev, user],
			);
		},
		[isSelected, setSelected],
	);

	return (
		<div className="rounded-xl bg-white z-20">
			<div className="flex items-center gap-2 px-3 py-2.5 border-b">
				<Search className="w-4 h-4 text-primary60" />
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search user"
					className="w-full text-sm outline-none text-primary80 placeholder:text-primary60"
				/>
			</div>

			<div className="max-h-56 overflow-y-auto">
				{filteredUsers.map((user) => {
					const checked = isSelected(user.email);

					return (
						<button
							key={user.email}
							type="button"
							onClick={() => toggleUser(user)}
							className={cn(
								'w-full p-2 flex gap-3 items-center text-left hover:bg-purple-2',
								checked && 'bg-purple-4 hover:bg-purple-4',
							)}
						>
							<div
								className={cn(
									'w-4 h-4 rounded-sm border flex items-center justify-center shrink-0',
									checked
										? 'bg-primary border-primary'
										: 'border-primary80 border-2',
								)}
							>
								{checked && <Check className="w-3 h-3 text-white" />}
							</div>

							<div className="flex flex-col gap-0.5 w-[90%]">
								<p className="text-sm text-primary80 truncate">
									{user.name}
								</p>
								<p className="text-xs text-primary60 truncate">
									{user.email}
								</p>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}

export function AssignedToField({
	users,
	assignedUsers,
	setAssignedUsers,
	resetFields,
}) {
	const [isOpen, setIsOpen] = useState(false);

	const handleRemoveUser = useCallback(
		(user) => {
			if (assignedUsers.length === 1) {
				resetFields?.();
			}
			setAssignedUsers((prev) => prev.filter((u) => u.email !== user.email));
		},
		[setAssignedUsers, assignedUsers],
	);

	// Close popover on scroll
	useEffect(() => {
		if (!isOpen) return;

		const handleScroll = () => {
			setIsOpen(false);
		};
		const scrollContainer = document.querySelector(
			'[data-resolution-modal-scroll]',
		);
		if (scrollContainer) {
			scrollContainer.addEventListener('scroll', handleScroll);
			return () => {
				scrollContainer.removeEventListener('scroll', handleScroll);
			};
		}
	}, [isOpen]);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<div className="h-12 px-3.5 py-2 bg-white border rounded-lg flex items-center gap-2 cursor-pointer">
					<div className="flex gap-2 items-center overflow-x-auto flex-1">
						{assignedUsers.length > 0 ? (
							assignedUsers.map((user) => (
								<AssignedToPill
									key={user.email}
									user={user}
									onRemove={handleRemoveUser}
								/>
							))
						) : (
							<span className="text-primary60 text-sm">
								Assign reviewer
							</span>
						)}
					</div>

					<ChevronDown className="w-4 h-4 text-primary60 shrink-0" />
				</div>
			</PopoverTrigger>

			<PopoverContent
				align="start"
				sideOffset={4}
				className="w-[30rem] p-0 rounded-xl border shadow-lg bg-white z-[9999]"
			>
				<AssignedToDropdown
					users={users}
					selected={assignedUsers}
					setSelected={setAssignedUsers}
				/>
			</PopoverContent>
		</Popover>
	);
}

function TimelineIcon() {
	return (
		<div className="flex flex-col items-center">
			<div className="w-9 h-7 rounded-full bg-[#0000001A] flex items-center justify-center">
				<Clock className="w-3.5 h-3.5 text-primary80" />
			</div>
			<div className="w-px flex-1 bg-gray-200 mt-2" />
		</div>
	);
}

const getFormattedDate = (event) => {
	if (!event?.date) return null;

	if (typeof event.date === 'string') {
		return event.date;
	}

	const d = new Date(event.date);
	return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB');
};

function getActionSentence(event) {
	switch (event.type) {
		case 'FLAGGED':
			return (
				<>
					has flagged an{' '}
					<span className="text-primary80 font-semibold">Exception</span>.
				</>
			);

		case 'STATUS':
			return (
				<>
					has updated the{' '}
					<span className="text-primary80 font-semibold">Status</span>.
				</>
			);

		case 'CHANGES':
			return <>has made the changes.</>;

		case 'COMMENT':
			return (
				<>
					updated the{' '}
					<span className="text-primary80 font-semibold">Comment</span>.
				</>
			);

		case 'ATTACHMENT':
			return (
				<>
					has attached the{' '}
					<span className="text-primary80 font-semibold">
						Proof of evidence
					</span>
					.
				</>
			);

		default:
			return null;
	}
}

function TimelineDetails({ event }) {
	const { renderCommentWithMentions } = useCommentRendering();

	switch (event.type) {
		case 'STATUS':
			return (
				<div className="flex items-center gap-2 text-sm text-primary80">
					<span className="font-medium shrink-0">Status</span>
					<ArrowRight className="w-4 h-4 text-primary60 shrink-0" />
					<Pill {...event.payload.status} />
				</div>
			);

		case 'CHANGES':
			const changeItems = [];
			if (event.payload.status) {
				changeItems.push(
					<div
						key="status"
						className="flex items-center gap-2 text-sm text-primary80"
					>
						<span className="font-medium shrink-0">Status</span>
						<ArrowRight className="w-4 h-4 text-primary60 shrink-0" />
						<Pill {...event.payload.status} />
					</div>,
				);
			}
			if (event.payload.action) {
				changeItems.push(
					<div
						key="action"
						className="flex items-center gap-2 text-sm text-primary80"
					>
						<span className="font-medium shrink-0">Action</span>
						<ArrowRight className="w-4 h-4 text-primary60 shrink-0" />
						<Pill {...event.payload.action} />
					</div>,
				);
			}
			if (event.payload.assignedTo?.length > 0) {
				changeItems.push(
					<div
						key="assignedTo"
						className="flex items-center gap-2 text-sm text-primary80 flex-wrap"
					>
						<span className="font-medium shrink-0">Assigned to</span>
						<ArrowRight className="w-4 h-4 text-primary60 shrink-0" />
						{event.payload.assignedTo.map((u) => (
							<AssignedToPill key={u.email || u.name} user={u} />
						))}
					</div>,
				);
			}
			if (event.payload.dueDate) {
				changeItems.push(
					<div
						key="dueDate"
						className="flex items-center gap-2 text-sm text-primary80"
					>
						<span className="font-medium shrink-0">Due date</span>
						<ArrowRight className="w-4 h-4 text-primary60 shrink-0" />
						<div className="px-1 py-0.5 bg-purple-4 border border-purple-8 primary80 rounded-md">
							{event.payload.dueDate}
						</div>
					</div>,
				);
			}
			if (event.payload.severity) {
				changeItems.push(
					<div
						key="severity"
						className="flex items-center gap-2 text-sm text-primary80"
					>
						<span className="font-medium shrink-0">Severity</span>
						<ArrowRight className="w-4 h-4 text-primary60 shrink-0" />
						<Pill {...event.payload.severity} />
					</div>,
				);
			}

			const hasComment = !!event.payload.comment;
			const hasFiles = event.payload.files?.length > 0;

			if (hasComment) {
				changeItems.push(
					<div
						key="comment"
						className="flex items-start gap-2 text-sm text-primary80"
					>
						<span className="font-medium shrink-0">Comment</span>
						<ArrowRight className="w-4 h-4 text-primary60 mt-0.5 shrink-0" />
						<div className="flex-1 mt-0.5">
							<p className="text-xs text-primary60">
								{renderCommentWithMentions(event.payload.comment)}
							</p>
							{hasFiles && (
								<div className="flex gap-2 flex-wrap mt-2">
									{event.payload.files.map((file) => {
										const isUrl = file.startsWith('http');
										const displayName = isUrl
											? extractFileName(file)
											: file;
										return (
											<TimelineFile
												key={file}
												fileName={displayName}
												fileUrl={isUrl ? file : null}
											/>
										);
									})}
								</div>
							)}
						</div>
					</div>,
				);
			}

			if (hasFiles && !hasComment) {
				changeItems.push(
					<div
						key="files"
						className="flex items-center gap-2 text-sm text-primary80"
					>
						<span className="font-medium shrink-0">
							Proof of Evidence
						</span>
						<ArrowRight className="w-4 h-4 text-primary60 shrink-0" />
						<div className="flex gap-2 flex-wrap">
							{event.payload.files.map((file) => {
								const isUrl = file.startsWith('http');
								const displayName = isUrl
									? extractFileName(file)
									: file;
								return (
									<TimelineFile
										key={file}
										fileName={displayName}
										fileUrl={isUrl ? file : null}
									/>
								);
							})}
						</div>
					</div>,
				);
			}

			return <div className="space-y-2.5">{changeItems}</div>;

		case 'COMMENT':
			return (
				<p className="text-xs text-primary60">
					{renderCommentWithMentions(event.payload.comment)}
				</p>
			);

		case 'ATTACHMENT':
			return (
				<div className="flex gap-2 flex-wrap">
					{event.payload.files.map((file) => {
						const isUrl = file.startsWith('http');
						const displayName = isUrl ? extractFileName(file) : file;
						return (
							<TimelineFile
								key={file}
								fileName={displayName}
								fileUrl={isUrl ? file : null}
							/>
						);
					})}
				</div>
			);
		default:
			return null;
	}
}

function TimelineCard({ event }) {
	const formattedDate = getFormattedDate(event);

	const displayName = event.actor || 'Unknown';
	const initials = displayName
		.split(' ')
		.map((n) => n[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	return (
		<div className="flex-1 border rounded-xl px-4 py-4 bg-white">
			<div className="flex justify-between items-start">
				<div className="flex gap-3 items-start">
					<div className="w-8 h-8 rounded-full bg-purple-4 font-medium text-primary80 flex items-center justify-center text-xs shrink-0">
						{initials}
					</div>

					<div className="flex flex-col gap-2 mt-1">
						<p className="text-sm text-primary60 ">
							<span className="font-medium text-primary80 mr-1">
								{displayName}
							</span>
							{getActionSentence(event)}
						</p>

						<TimelineDetails event={event} />
					</div>
				</div>

				{formattedDate && (
					<p className="text-xs text-primary60 shrink-0">
						{formattedDate}
					</p>
				)}
			</div>
		</div>
	);
}

function StatusDisplay({ value }) {
	const getStatusOption = (val) => {
		if (value.toLowerCase()?.includes('pending'))
			return STATUS_OPTIONS.REVIEW_PENDING;
		if (value.toLowerCase()?.includes('done')) return STATUS_OPTIONS.COMPLETED;
		return null;
	};

	const option = getStatusOption(value);

	if (option) {
		return (
			<div className="h-12 px-3.5 py-2 flex items-center border rounded-lg text-primary80 opacity-100">
				<div
					className={cn(
						'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
						option.bgClass,
						option.textClass,
						option.borderClass,
					)}
				>
					<span
						className={cn(
							'w-2 h-2 rounded-full shrink-0',
							option.dotClass,
						)}
					/>
					<span>{value}</span>
				</div>
			</div>
		);
	}
}

function CaseGridMemo({
	action,
	setAction,
	severity,
	setSeverity,
	dueDate,
	setDueDate,
	users,
	assignedUsers,
	setAssignedUsers,
	caseData,
	flagging,
	setFlagging,
	initialAssignedUsers,
	setDescription,
	initialState,
	isOwner,
}) {
	// Check if flagging is "False Positive" (red = TRUE_EXCEPTION in this config)
	// Based on FLAG_CONFIG, 'red' has label 'True Exception', 'green' has label 'False Positive'
	const isFalsePositive = flagging === FLAG_TYPES.FALSE_POSITIVE; // 'green' = False Positive

	// Wrapped setters that require assign-to
	const handleSetAction = useCallback(
		(value) => {
			if (assignedUsers.length === 0) {
				toast.error('Please select an assignee first');
				return;
			}
			setAction(value);
		},
		[assignedUsers, setAction],
	);

	const handleSetSeverity = useCallback(
		(value) => {
			if (assignedUsers.length === 0) {
				toast.error('Please select an assignee first');
				return;
			}
			setSeverity(value);
		},
		[assignedUsers, setSeverity],
	);

	const handleSetDueDate = useCallback(
		(value) => {
			if (assignedUsers.length === 0) {
				toast.error('Please select an assignee first');
				return;
			}
			setDueDate(value);
		},
		[assignedUsers, setDueDate],
	);

	// Flagging can be changed without assign-to, but other fields will be disabled if False Positive
	const handleSetFlagging = useCallback(
		(value) => {
			if (assignedUsers.length === 0 && value === 'red') {
				toast.error('Please select an assignee first');
				return;
			}
			setFlagging(value);
		},
		[assignedUsers, setFlagging],
	);

	const resetFields = () => {
		setAction(initialState?.action || '');
		setSeverity(initialState?.severity || '');
		setDueDate(initialState?.dueDate || null);

		if (flagging === 'red') {
			setFlagging(initialState?.flagging || '');
		}
		setDescription(initialState?.description || '');
	};

	return (
		<div className="grid grid-cols-3 gap-x-4 gap-y-3">
			<FormField label="Case ID" disabled={true}>
				<Input value={caseData?.caseId || ''} className="h-12 px-3.5 py-2" />
			</FormField>

			<FormField label="Status" disabled={true}>
				<StatusDisplay value={caseData?.status || ''} />
			</FormField>

			<FormField label="Flagged by" disabled={true}>
				<div className="h-12 px-3.5 py-2 border rounded-lg flex items-center cursor-not-allowed">
					{caseData?.flaggedBy?.name ? (
						<FlaggedByPill
							initials={caseData.flaggedBy.name
								.split(' ')
								.map((n) => n[0])
								.join('')
								.slice(0, 2)
								.toUpperCase()}
							name={caseData.flaggedBy.name}
						/>
					) : (
						<span className="text-primary60 text-sm">Not assigned</span>
					)}
				</div>
			</FormField>

			<FormField label="Flagged on" disabled={true}>
				<Input
					className="h-12 px-3.5 py-2"
					value={
						caseData?.flaggedOn
							? new Date(caseData.flaggedOn).toLocaleDateString()
							: ''
					}
				/>
			</FormField>

			<FormField label="Mark as" disabled={!isOwner}>
				<Select value={flagging} onValueChange={handleSetFlagging}>
					<SelectTrigger className="w-full h-12 bg-white border-[#E5E7EB]">
						{flagging ? (
							<div className="flex items-center gap-2">
								<Flag type={flagging} isActive={true} />
								<span className="text-sm font-medium text-[#26064ACC]">
									{FLAG_CONFIG?.[flagging]?.label}
								</span>
							</div>
						) : (
							<span className="text-primary60 text-sm">
								Select marking
							</span>
						)}
					</SelectTrigger>
					<SelectContent>
						{Object.values(FLAG_TYPES).map((type) => (
							<SelectItem
								key={type}
								value={type}
								className="hover:bg-gray-100"
							>
								<div className="flex items-center gap-2">
									<Flag type={type} isActive={true} />
									<span className="text-sm font-medium text-[#26064ACC]">
										{FLAG_CONFIG?.[type]?.label}
									</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</FormField>

			<FormField label="Action" disabled={isFalsePositive || !isOwner}>
				<PillSelect
					value={action}
					onChange={handleSetAction}
					options={ACTION_OPTIONS}
					placeholder="Select"
				/>
			</FormField>

			<FormField label="Assigned to" disabled={!isOwner}>
				<AssignedToField
					users={users}
					assignedUsers={assignedUsers}
					setAssignedUsers={setAssignedUsers}
					initialAssignedUsers={initialAssignedUsers}
					resetFields={resetFields}
				/>
			</FormField>

			<FormField label="Due Date" disabled={isFalsePositive || !isOwner}>
				<DatePicker value={dueDate} onChange={handleSetDueDate} />
			</FormField>

			<FormField label="Severity" disabled={isFalsePositive || !isOwner}>
				<PillSelect
					value={severity}
					onChange={handleSetSeverity}
					options={SEVERITY_OPTIONS}
					placeholder="Select"
				/>
			</FormField>
		</div>
	);
}

const CaseGrid = memo(CaseGridMemo);

function DescriptionField({
	value,
	onChange,
	disabled,
	assignedUsers,
	isOwner = true,
}) {
	const handleChange = useCallback(
		(e) => {
			if (assignedUsers?.length === 0) {
				toast.error('Please select an assignee first');
				return;
			}
			onChange(e);
		},
		[assignedUsers, onChange],
	);

	const isDisabled = disabled || !isOwner;

	return (
		<FormField label="Description">
			<textarea
				className={cn(
					'w-full border max-h-40 min-h-20 border-primary8 text-primary80 rounded-lg px-3.5 py-2.5 text-sm',
					isDisabled && 'bg-gray-100 cursor-not-allowed opacity-60',
				)}
				rows={3}
				value={value}
				onChange={isDisabled ? undefined : handleChange}
				placeholder="Add description..."
				disabled={isDisabled}
			/>
		</FormField>
	);
}

function ResolutionTrailSectionComponent({ events }) {
	return (
		<div className="mt-4 space-y-3">
			<p className="font-medium text-sm text-primary80">Resolution Trail</p>
			<div className="space-y-4">
				{events.map((event) => (
					<div key={event.id} className="flex gap-2">
						<TimelineIcon />
						<TimelineCard event={event} />
					</div>
				))}
			</div>
		</div>
	);
}

function CommentComposerComponent({
	value,
	onChange,
	files,
	addFiles,
	removeFile,
	progress,
	uploadedMetadata,
	users,
}) {
	const fileInputRef = React.useRef(null);
	const allowedFileTypes = UPLOAD_CONTEXTS.COMMENTS;

	const getFilesWithSingleExtension = (allFiles) => {
		const singleExtensionFiles = Array.from(allFiles).filter((file) => {
			return file.name.split('.').length === 2;
		});

		return singleExtensionFiles;
	};

	const getFilesHavingCorrectType = (files, filesInfo) => {
		const filesHavingCorrectType = [];

		files?.forEach((file, index) => {
			const extInName = file.name.split('.')[1];
			const fileInfo = filesInfo[index];
			if (extInName === fileInfo?.ext) {
				filesHavingCorrectType.push(file);
			} else {
				filesHavingCorrectType.push(null);
			}
		});

		return filesHavingCorrectType;
	};

	const getAllowedFiles = (allFiles, filesInfo) => {
		const allowedFiles = [];
		const allowedFileTypes = ['pdf', 'jpg', 'png', 'gif'];
		let hasNotAllowedFiles = false;

		allFiles.forEach((file, index) => {
			if (!file) return;

			if (allowedFileTypes.includes(filesInfo[index].ext)) {
				allowedFiles.push(file);
			} else {
				hasNotAllowedFiles = true;
			}
		});

		return [allowedFiles, hasNotAllowedFiles];
	};

	const getFilesInfo = async (files) => {
		const filesInfo = [];
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const fileInfo = await fileTypeFromBlob(file);
			if (fileInfo) {
				filesInfo.push(fileInfo);
			} else {
				filesInfo.push({
					ext: file?.name?.split('.')?.[1],
					type: file.type,
				});
			}
		}
		return filesInfo;
	};

	const getAllowedValidFiles = async (files) => {
		// remove files files more than 1 ext
		const singleExtensionFiles = getFilesWithSingleExtension(files);
		if (singleExtensionFiles.length !== files.length) {
			toast.error('Some files have invalid names!');
		}

		// get files info
		const filesInfo = await getFilesInfo(singleExtensionFiles);

		// remove files having incorrect ext.
		const filesHavingCorrectType = getFilesHavingCorrectType(
			singleExtensionFiles,
			filesInfo,
		);
		if (filesHavingCorrectType.includes(null)) {
			toast.error('Some files have incorrect extensions!');
		}

		// remove allowed files
		const [allowedFiles, hasNotAllowedFiles] = getAllowedFiles(
			filesHavingCorrectType,
			filesInfo,
		);
		if (hasNotAllowedFiles) {
			toast.error('Some files are not supported!');
		}

		return allowedFiles;
	};

	const handleFileSelect = useCallback(
		async (e) => {
			const uplodedFiles = e.target.files;

			if (uplodedFiles.length === 0) {
				return;
			}

			const allowedValidFiles = await getAllowedValidFiles(uplodedFiles);

			addFiles(allowedValidFiles);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		},
		[addFiles, allowedFileTypes],
	);

	const documentFiles = useMemo(() => {
		return files;
	}, [files]);

	const handleRemoveFile = useCallback(
		(fileOrName) => {
			const fileName =
				typeof fileOrName === 'string' ? fileOrName : fileOrName.name;
			removeFile(fileName);
		},
		[removeFile],
	);

	// Transform users for react-mentions
	const mentionUsers = useMemo(() => {
		return users.map((user) => ({
			id: user.user_id || user.email,
			display: user.name || user.email,
		}));
	}, [users]);

	return (
		<div className="mt-4">
			<div className="flex flex-col gap-3 w-full rounded-xl border border-primary8 bg-white">
				<div className="p-3">
					<MentionsInput
						value={value}
						onChange={(e) =>
							onChange({ target: { value: e.target.value } })
						}
						placeholder="Add a comment or attach proof of evidence (.csv or .pdf files)..."
						className="w-full text-sm text-primary80"
						style={mentionsInputStyle}
						a11ySuggestionsListLabel="Suggested people"
					>
						<Mention
							trigger="@"
							data={mentionUsers}
							markup="@[__display__](__id__)"
							appendSpaceOnAdd
							style={mentionStyle}
							displayTransform={(id, display) => `@${display}`}
							placement="top"
							renderSuggestion={(
								entry,
								search,
								highlightedDisplay,
								index,
								focused,
							) => {
								const initials = entry.display
									.split(' ')
									.map((w) => w[0])
									.slice(0, 2)
									.join('')
									.toUpperCase();

								return (
									<div
										className={cn(
											'flex items-center gap-2 px-4 py-2 hover:bg-purple-4',
											focused && 'bg-purple-4',
										)}
									>
										<div className="w-7 h-7 rounded-full bg-[#1E40AF1A] text-[#26064A] text-xs font-medium flex items-center justify-center shrink-0">
											{initials}
										</div>

										<div className="text-sm text-primary80 truncate">
											{highlightedDisplay}
										</div>
									</div>
								);
							}}
						/>
					</MentionsInput>
				</div>

				{/* Bottom Actions */}
				<div className="flex items-center justify-between px-3 py-2 border-t border-primary8">
					<div className="flex items-center gap-2">
						<label className="cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
							<input
								ref={fileInputRef}
								type="file"
								multiple
								accept={getAcceptString(allowedFileTypes)}
								onChange={handleFileSelect}
								className="hidden"
							/>
							<Paperclip className="w-4 h-4 text-primary60" />
						</label>
					</div>
				</div>

				{/* Document Files Preview */}
				{documentFiles.length > 0 && (
					<div className="flex gap-3 flex-wrap px-3 pb-3">
						{documentFiles.map((file) => (
							<FilePreview
								key={file.id}
								fileName={file.name}
								handleCancel={handleRemoveFile}
								progress={progress[file.name]}
								showProgress={true}
								canCross={true}
								fileUrl={uploadedMetadata?.[file.id]?.url}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

/* ================================================================
   MAIN MODAL COMPONENT
   ================================================================ */

export default function ResolutionTrailModal({ open, onClose }) {
	const { userDetails: user } = useAuth();
	const { isOwner } = useReportPermission();
	const userId = user?.external_id || user?.id || user?.user_id;
	const { query, params } = useRouter();

	const reportId = params?.reportId;
	const cardId = query?.card_id;
	const caseId = query?.case_id;
	const isOpen = open || !!caseId;

	const handleModalClose = useCallback(() => {
		const params = new URLSearchParams(window.location.search);
		params.delete('case_id');
		const newUrl = `${window.location.pathname}?${params.toString()}`;
		window.history.replaceState({}, '', newUrl);

		onClose?.();
	}, [onClose]);

	// Fetch case details
	const { data: fetchedCaseData, isLoading: isCaseLoading } = useQuery({
		queryKey: ['case-details', reportId, cardId, caseId],
		queryFn: async () => {
			if (!reportId || !cardId || !caseId) {
				return null;
			}

			try {
				const data = await getCaseDetails({
					reportId,
					cardId,
					caseId: caseId,
				});
				return data;
			} catch (error) {
				console.error('Failed to fetch case details:', error);
				return null;
			}
		},
		enabled: isOpen && !!reportId && !!cardId && !!caseId,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});

	// Transform fetched case data to the format expected by useFormState
	const transformedCaseData = useMemo(() => {
		if (!fetchedCaseData || !fetchedCaseData.case) return null;

		const caseData = fetchedCaseData.case;

		return {
			caseId: caseData.case_id,
			status: caseData.status,
			severity: caseData.severity,
			dueDate: caseData.due_date ? new Date(caseData.due_date) : null,
			description: caseData.description || '',
			assigned: Array.isArray(caseData.assigned_to)
				? caseData.assigned_to
				: [],
			flagging: caseData.flagging,
			flaggedBy: caseData.flagged_by ? { name: caseData.flagged_by } : null,
			flaggedOn: caseData.flagged_on || '',
			comments: caseData.comments,
			action:
				ACTION_MAP_TO_UI[caseData.action_status] || caseData.action_status,
		};
	}, [fetchedCaseData]);

	const {
		dueDate,
		setDueDate,
		action,
		setAction,
		severity,
		setSeverity,
		description,
		setDescription,
		comment,
		setComment,
		assignedUsers,
		setAssignedUsers,
		flagging,
		setFlagging,
		hasChanges,
		getUpdates,
		updateInitialState,
		initialState,
	} = useFormState(transformedCaseData);

	// File upload hook
	const {
		addFiles,
		files,
		removeFile,
		progress,
		resetUploads,
		isAllFilesUploaded,
		uploadedMetadata,
	} = useFileUploadsV2();

	const hasRequiredParams = !!(reportId && cardId && caseId && userId);

	const { data: trailApiData } = useQuery({
		queryKey: ['resolutionTrail', reportId, cardId, caseId, userId],
		queryFn: async () => {
			if (!reportId || !cardId || !caseId || !userId) {
				return [];
			}

			try {
				const data = await getResolutionTrail({
					reportId,
					cardId,
					caseId: caseId,
				});
				return data;
			} catch (error) {
				console.error('Failed to fetch resolution trail:', error);
				return [];
			}
		},
		enabled: isOpen && hasRequiredParams,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});

	const { data: shareableUsersData } = useQuery({
		queryKey: ['shareable-users'],
		queryFn: getShareableUsers,
		enabled: isOpen,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});

	const deduplicatedUsers = useMemo(() => {
		if (!shareableUsersData) return [];

		const usersArray = Array.isArray(shareableUsersData)
			? shareableUsersData
			: [];

		const seen = new Set();
		return usersArray.filter((user) => {
			if (seen.has(user.email)) return false;
			seen.add(user.email);
			return true;
		});
	}, [shareableUsersData]);

	// Use a ref to track if we've synced assigned users for the current deduplicatedUsers
	const hasSyncedAssignedUsers = React.useRef(false);
	const prevDeduplicatedUsersRef = React.useRef(deduplicatedUsers);

	// Reset sync flag when deduplicatedUsers actually changes (by reference)
	if (prevDeduplicatedUsersRef.current !== deduplicatedUsers) {
		prevDeduplicatedUsersRef.current = deduplicatedUsers;
		hasSyncedAssignedUsers.current = false;
	}

	useEffect(() => {
		if (hasSyncedAssignedUsers.current) return;
		if (deduplicatedUsers.length === 0 || assignedUsers.length === 0) return;

		const updatedAssigned = assignedUsers.map((assigned) => {
			const matching = deduplicatedUsers.find((u) => u.name === assigned.name);
			if (matching) {
				return matching;
			}
			return assigned;
		});

		// Only update if there's a change
		const hasChanged =
			JSON.stringify(updatedAssigned) !== JSON.stringify(assignedUsers);
		hasSyncedAssignedUsers.current = true;

		if (hasChanged) {
			setAssignedUsers(updatedAssigned);
			updateInitialState((prevState) => ({
				...prevState,
				assignedUsers: updatedAssigned,
			}));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deduplicatedUsers, assignedUsers]);

	const updateCaseMutation = useMutation({
		mutationFn: updateCaseData,
		onSuccess: (data) => {
			toast.success('Case updated successfully');
			queryClient.invalidateQueries(['resolutionTrail']);
			queryClient.invalidateQueries(['report-card-cases', reportId, cardId]);
			resetUploads();
			setComment('');
		},
		onError: (error) => {
			console.error('Failed to update case:', error);
			toast.error(error.response?.data?.message || 'Failed to update case');
		},
	});

	const handleSaveChanges = useCallback(() => {
		if (!hasChanges && !comment?.trim() && files.length === 0) return;

		// If files are present but not all uploaded yet, don't proceed
		if (files.length > 0 && !isAllFilesUploaded) {
			toast.error('Please wait for all files to upload');
			return;
		}

		const updates = getUpdates();

		let commentMessage = '';
		let fileUrls = [];

		if (comment && comment.trim()) {
			commentMessage = comment.trim();
		}

		if (files.length > 0) {
			fileUrls = files
				.map((file) => uploadedMetadata?.[file.id]?.url)
				.filter(Boolean);

			// Verify all files have URLs
			if (fileUrls.length !== files.length) {
				console.error('File upload verification failed:', {
					totalFiles: files.length,
					uploadedFiles: fileUrls.length,
					uploadedMetadata,
				});
				toast.error('Some files failed to upload. Please try again.');
				return;
			}
		}

		updateCaseMutation.mutate({
			reportId,
			cardId,
			caseId: caseId,
			updates,
			isSample: false,
			commentMessage,
			fileUrls: fileUrls,
		});
	}, [
		hasChanges,
		getUpdates,
		comment,
		files,
		uploadedMetadata,
		isAllFilesUploaded,
		reportId,
		cardId,
		caseId,
		updateCaseMutation,
	]);

	const handleCommentChange = useCallback(
		(e) => {
			setComment(e.target.value);
		},
		[setComment],
	);

	const handleDescriptionChange = useCallback(
		(e) => {
			setDescription(e.target.value);
		},
		[setDescription],
	);

	useEffect(() => {
		if (!open && !caseId) {
			resetUploads();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, caseId]);

	// Check if save should be disabled
	const isSaveDisabled = useMemo(() => {
		const hasFormChanges = hasChanges;
		const hasCommentOrFiles = comment?.trim() || files.length > 0;
		const filesStillUploading = files.length > 0 && !isAllFilesUploaded;

		return (
			(!hasFormChanges && !hasCommentOrFiles) ||
			(hasFormChanges &&
				!hasCommentOrFiles &&
				assignedUsers.length === 0 &&
				flagging !== 'green') ||
			filesStillUploading ||
			updateCaseMutation.isPending
		);
	}, [
		hasChanges,
		comment,
		files,
		isAllFilesUploaded,
		updateCaseMutation.isPending,
		assignedUsers,
	]);

	const events = useMemo(() => {
		// Always include the flagged event
		const flaggedDate = transformedCaseData?.flaggedOn
			? new Date(transformedCaseData.flaggedOn).toLocaleDateString('en-GB')
			: '';

		const flaggedEvent = {
			id: 'flagged',
			type: 'FLAGGED',
			actor: transformedCaseData?.flaggedBy?.name || 'Unknown',
			date: flaggedDate,
		};

		// If there's no API data, return only the flagged event
		if (
			!trailApiData ||
			(Array.isArray(trailApiData) && trailApiData.length === 0)
		) {
			return [flaggedEvent];
		}

		// Existing transformation when API provides trail data
		const events = [
			flaggedEvent,
			...trailApiData.flatMap((item, index) => {
				const actor = item.username || 'Unknown';
				const date = new Date(item.timestamp).toLocaleDateString('en-GB');
				const itemEvents = [];

				if (item.actions && item.actions.length > 0) {
					const changes = {};
					const files = [];
					let hasOnlyFileUploads = true;

					item.actions.forEach((action) => {
						if (action.action_type === 'ValueUpdate') {
							hasOnlyFileUploads = false;
							const column = action.column_name;
							const value = action.new_value;

							if (column === 'status') {
								const statusKey = STATUS_MAP_TO_UI[value];
								changes.status = STATUS_OPTIONS[statusKey];
							} else if (column === 'severity') {
								const severityKey = SEVERITY_MAP_TO_UI[value];
								if (severityKey)
									changes.severity = SEVERITY_OPTIONS[severityKey];
							} else if (column === 'action_status') {
								const actionKey = ACTION_MAP_TO_UI[value];
								if (actionKey)
									changes.action = ACTION_OPTIONS[actionKey];
							} else if (column === 'assigned_to') {
								const assignedUsernames = Array.isArray(value)
									? value
									: [];
								const assignedUsers = assignedUsernames
									.map((username) => ({
										name: username,
									}))
									.filter(Boolean);
								changes.assignedTo = assignedUsers;
							} else if (column === 'due_date') {
								changes.dueDate = new Date(
									value,
								).toLocaleDateString();
							}
							// description and flagging not shown in timeline changes
						} else if (action.action_type === 'FileUploaded') {
							if (
								action.file_urls &&
								Array.isArray(action.file_urls)
							) {
								action.file_urls.forEach((fileUrl) => {
									files.push(fileUrl);
								});
							}
						}
					});

					// If only file uploads with no other changes, create ATTACHMENT event
					if (hasOnlyFileUploads && files.length > 0) {
						itemEvents.push({
							id: `attachment-${index}`,
							type: 'ATTACHMENT',
							actor,
							date,
							payload: { files },
						});
					} else if (
						Object.keys(changes).length > 0 ||
						files.length > 0 ||
						item.comment_message
					) {
						// Otherwise, include files in CHANGES event
						if (files.length > 0) {
							changes.files = files;
						}

						const event = {
							id: `changes-${index}`,
							type: 'CHANGES',
							actor,
							date,
							payload: changes,
						};
						if (item.comment_message) {
							event.payload.comment = item.comment_message;
						}
						itemEvents.push(event);
					}
				} else if (item.comment_message) {
					itemEvents.push({
						id: `comment-${index}`,
						type: 'COMMENT',
						actor,
						date,
						payload: { comment: item.comment_message },
					});
				}

				return itemEvents;
			}),
		];

		return events;
	}, [trailApiData, transformedCaseData]);

	if (isCaseLoading) {
		return (
			<Dialog open={isOpen} onOpenChange={handleModalClose}>
				<DialogContent className="max-w-5xl rounded-2xl shadow-lg px-6 py-4 gap-0">
					<div className="flex items-center justify-center h-96">
						<div className="flex flex-col items-center gap-2 text-primary80">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
							<span>Loading case details...</span>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	if (!transformedCaseData) {
		return (
			<Dialog open={isOpen} onOpenChange={handleModalClose}>
				<DialogContent className="max-w-5xl rounded-2xl shadow-lg px-6 py-4 gap-0">
					<div className="flex items-center justify-center h-96">
						<p className="text-primary80">
							Failed to load case details. Please try again.
						</p>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleModalClose}>
			<DialogContent className="max-w-5xl rounded-2xl shadow-lg px-6 py-4 gap-0">
				<DialogHeader className="pt-3 pb-5 border-b border-gray-300">
					<DialogTitle className="flex items-center gap-4 text-base font-semibold text-primary80">
						<div className="relative w-14 h-14 flex items-center justify-center">
							<div className="absolute inset-0 rounded-full bg-purple-8" />
							<div className="absolute w-10 h-10 rounded-full bg-purple-16 opacity-60" />
							<Clock className="relative w-5 h-5 text-primary" />
						</div>
						Resolution Trail
					</DialogTitle>
				</DialogHeader>

				<div
					className="max-h-[55vh] overflow-y-auto overflow-x-hidden py-6"
					data-resolution-modal-scroll
				>
					<CaseGrid
						action={action}
						setAction={setAction}
						severity={severity}
						setSeverity={setSeverity}
						dueDate={dueDate}
						setDueDate={setDueDate}
						users={deduplicatedUsers}
						assignedUsers={assignedUsers}
						setAssignedUsers={setAssignedUsers}
						caseData={transformedCaseData}
						flagging={flagging}
						setFlagging={setFlagging}
						initialAssignedUsers={initialState?.assignedUsers}
						setDescription={setDescription}
						initialState={initialState}
						isOwner={isOwner}
					/>
					<div className="mt-3">
						<DescriptionField
							value={description}
							onChange={handleDescriptionChange}
							disabled={flagging === FLAG_TYPES.FALSE_POSITIVE}
							assignedUsers={assignedUsers}
							isOwner={isOwner}
						/>
					</div>

					<ResolutionTrailSectionComponent events={events} />

					<CommentComposerComponent
						value={comment}
						onChange={handleCommentChange}
						files={files}
						addFiles={addFiles}
						removeFile={removeFile}
						progress={progress}
						uploadedMetadata={uploadedMetadata}
						users={deduplicatedUsers}
					/>
				</div>

				<div className="flex justify-end gap-2 pt-4 border-t">
					<Button
						variant="outline"
						onClick={handleModalClose}
						className="text-primary80 text-sm px-4 py-2 rounded-lg font-medium"
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						disabled={isSaveDisabled}
						onClick={handleSaveChanges}
						className={cn(
							'bg-primary text-white text-sm px-4 py-2 rounded-lg font-medium hover:opacity-90',
							isSaveDisabled && 'opacity-50 cursor-not-allowed',
						)}
					>
						{updateCaseMutation.isPending ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
