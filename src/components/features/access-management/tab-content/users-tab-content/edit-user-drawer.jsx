import InputText from '@/components/elements/InputText';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MultiSelect from '@/components/elements/MultiSelect';
import { cn } from '@/lib/utils';

export default function EditUserDrawer({ open, setOpen, user }) {
	const [teams, setTeams] = useState([]);
	const [selectedTeams, setSelectedTeams] = useState([]);
	const [roles, setRoles] = useState([]);
	const [selectedRole, setSelectedRole] = useState(null);
	const [expandedRoleIds, setExpandedRoleIds] = useState([]);
	const [rolePermissions, setRolePermissions] = useState({});

	// Mock users data - replace with actual API call
	useEffect(() => {
		// Mock teams data - replace with actual API call
		const mockTeams = [
			{ value: 'engineering', label: 'Engineering' },
			{ value: 'marketing', label: 'Marketing' },
			{ value: 'sales', label: 'Sales' },
			{ value: 'design', label: 'Design' },
			{ value: 'product', label: 'Product' },
			{ value: 'hr', label: 'Human Resources' },
			{ value: 'finance', label: 'Finance' },
		];
		setTeams(mockTeams);

		// Mock roles data - replace with actual API call
		const mockRoles = [
			{ id: 'admin', name: 'Admin', description: 'Role Description' },
			{ id: 'manager', name: 'Manager', description: 'Role Description' },
			{
				id: 'ai-trainer',
				name: 'AI Trainer',
				description: 'Role Description',
			},
			{ id: 'reviewer', name: 'Reviewer', description: 'Role Description' },
			{ id: 'auditor', name: 'Auditor', description: 'Role Description' },
			{ id: 'user', name: 'User', description: 'Role Description' },
			{ id: 'viewer', name: 'Viewer', description: 'Role Description' },
			{ id: 'editor', name: 'Editor', description: 'Role Description' },
			{ id: 'creator', name: 'Creator', description: 'Role Description' },
		];
		setRoles(mockRoles);
		setSelectedRole('admin'); // Set default selection

		// Mock permissions data - replace with actual API call
		const mockPermissions = {
			admin: [
				{ permission: 'workflows-read', description: 'View workflows' },
				{
					permission: 'workflows-create',
					description: 'Create new workflows',
				},
				{
					permission: 'workflows-update',
					description: 'Edit workflow details',
				},
				{ permission: 'workflows-delete', description: 'Delete workflows' },
				{
					permission: 'users-manage',
					description: 'Manage users and permissions',
				},
				{ permission: 'reports-access', description: 'Access all reports' },
			],
			manager: [
				{ permission: 'workflows-read', description: 'View workflows' },
				{
					permission: 'workflows-create',
					description: 'Create new workflows',
				},
				{
					permission: 'workflows-update',
					description: 'Edit workflow details',
				},
				{ permission: 'reports-access', description: 'Access team reports' },
			],
			'ai-trainer': [
				{ permission: 'workflows-read', description: 'View workflows' },
				{ permission: 'models-train', description: 'Train AI models' },
				{
					permission: 'data-annotate',
					description: 'Annotate training data',
				},
			],
			reviewer: [
				{ permission: 'workflows-read', description: 'View workflows' },
				{
					permission: 'submissions-review',
					description: 'Review submissions',
				},
				{ permission: 'feedback-provide', description: 'Provide feedback' },
			],
			auditor: [
				{ permission: 'workflows-read', description: 'View workflows' },
				{ permission: 'logs-access', description: 'Access audit logs' },
				{
					permission: 'reports-view',
					description: 'View compliance reports',
				},
			],
			user: [
				{ permission: 'workflows-read', description: 'View workflows' },
				{
					permission: 'workflows-create',
					description: 'Create new workflows',
				},
			],
			viewer: [
				{ permission: 'workflows-read', description: 'View workflows' },
			],
			editor: [
				{ permission: 'workflows-read', description: 'View workflows' },
				{
					permission: 'workflows-update',
					description: 'Edit workflow details',
				},
			],
			creator: [
				{ permission: 'workflows-read', description: 'View workflows' },
				{
					permission: 'workflows-create',
					description: 'Create new workflows',
				},
			],
		};
		setRolePermissions(mockPermissions);
	}, []);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent
				side="right"
				className="p-0 max-w-[30rem] h-[100vh]"
				classBtnClass="!size-4"
			>
				<div className="h-full w-full relative">
					<SheetHeader className="p-6 pb-4">
						<SheetTitle className="text-base text-[#26064A] font-semibold">
							Edit user Information
						</SheetTitle>
					</SheetHeader>

					<div className="border-t border-[#6A12CD1A] pt-4 px-6 pb-5 space-y-4">
						<div className="p-3 border border-[#E6E2E9] rounded-lg grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1">
								<div className="text-xs text-[#26064A99] font-medium">
									Name
								</div>
								<div className="text-xs text-[#26064A] font-medium">
									{user.name}
								</div>
							</div>
							<div>
								<div className="text-xs text-[#26064A99] font-medium">
									Email
								</div>
								<div className="text-xs text-[#26064A] font-medium">
									{user.email}
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium text-[#26064A]">
								Team <span className="text-red-400">*</span>
							</label>
							<MultiSelect
								options={teams}
								onValueChange={setSelectedTeams}
								defaultValue={selectedTeams}
								placeholder="Select teams"
								variant="default"
								animation={2}
								maxCount={1}
								chipClassName="text-xs"
								closeIconClassName="text-2xl text-[#26064A]"
							/>
						</div>
					</div>

					<div className="border-t border-[#6A12CD1A] py-4 px-6">
						<div className="text-[#26064A] text-base font-medium">
							Initial Role
						</div>
						<div className="text-[#26064ACC] text-xs">
							You can assign only one role to a user.
						</div>
					</div>

					<div className="px-6 h-[calc(100%-24.8rem)] overflow-auto pb-3">
						<div className="space-y-3">
							{roles.map((role) => (
								<div
									key={role.id}
									className={`border rounded-lg transition-colors overflow-hidden ${
										selectedRole === role.id
											? 'border-[#6A12CD]'
											: 'border-[#6A12CD33]'
									}`}
								>
									<div
										className="flex items-center justify-between px-4 py-3 cursor-pointer"
										onClick={() => setSelectedRole(role.id)}
									>
										<div className="flex items-center gap-3 flex-1">
											<div
												className={cn(
													`flex-shrink-0 size-5 rounded-full border-1 flex items-center justify-center transition-colors border-[#26064A66] bg-white`,
													selectedRole === role.id &&
														'bg-[#6A12CD]',
												)}
											>
												{selectedRole === role.id && (
													<div className="size-2 rounded-full bg-white" />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="text-[#26064A] font-medium text-sm">
													{role.name}
												</div>
												<div className="text-[#26064ACC] text-xs mt-1">
													{role.description}
												</div>
											</div>
										</div>
										<Button
											variant="outline"
											size="sm"
											className="ml-3 flex items-center gap-2 text-[#26064A] border-gray-300 hover:bg-gray-50"
											onClick={(e) => {
												e.stopPropagation();
												setExpandedRoleIds((prev) =>
													prev.includes(role.id)
														? prev.filter(
																(id) =>
																	id !== role.id,
															)
														: [...prev, role.id],
												);
											}}
										>
											<Eye className="size-4" />
											<span className="text-sm">
												Permission
											</span>
											{expandedRoleIds.includes(role.id) ? (
												<ChevronUp className="size-4 ml-1" />
											) : (
												<ChevronDown className="size-4 ml-1" />
											)}
										</Button>
									</div>

									{/* Permissions Section */}
									{expandedRoleIds.includes(role.id) && (
										<div className="border-t border-[#6A12CD33]">
											{/* Table Header */}
											<div className="grid grid-cols-2 gap-4 px-4 py-3 border-b border-[#6A12CD33]">
												<div className="text-[#26064A] font-semibold text-xs">
													Permission
												</div>
												<div className="text-[#26064A] font-semibold text-xs">
													Description
												</div>
											</div>

											{/* Table Body */}
											<div className="divide-y divide-[#6A12CD33]">
												{rolePermissions[role.id]?.map(
													(perm, index) => (
														<div
															key={index}
															className="grid grid-cols-2 gap-4 px-4 py-3 bg-white"
														>
															<div className="text-[#26064A] text-xs font-medium">
																{perm.permission}
															</div>
															<div className="text-[#26064ACC] text-xs">
																{perm.description}
															</div>
														</div>
													),
												)}
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					</div>

					<div className="absolute bottom-0 left-0 w-full py-4 px-6 flex justify-between border-t border-[#6A12CD1A] bg-white">
						<Button
							variant="outline"
							className="border-[#26064A] !text-[#26064A]"
						>
							Disable User
						</Button>
						<Button>Update</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
