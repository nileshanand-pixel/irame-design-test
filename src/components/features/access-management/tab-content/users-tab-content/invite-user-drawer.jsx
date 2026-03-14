import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { Eye, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MultiSelect from '@/components/elements/MultiSelect';
import { cn } from '@/lib/utils';
import InputText from '@/components/elements/InputText';
import { roleService } from '@/api/gatekeeper/role.service';
import { getTeams } from '@/api/gatekeeper/team.service';
import { filterHiddenPermissionsList } from '@/lib/hidden-permissions';
import { userService } from '@/api/gatekeeper/user.service';
import { toast } from 'react-toastify';

export default function InviteUserDrawer({ open, setOpen, onSuccess }) {
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [teams, setTeams] = useState([]);
	const [selectedTeams, setSelectedTeams] = useState([]);
	const [roles, setRoles] = useState([]);
	const [selectedRole, setSelectedRole] = useState(null);
	const [expandedRoleIds, setExpandedRoleIds] = useState([]);
	const [rolePermissions, setRolePermissions] = useState({});
	const [loadingPermissions, setLoadingPermissions] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const [rolesRes, teamsRes] = await Promise.all([
					roleService.getAssignableRoles({ limit: 100 }),
					getTeams({ limit: 100 }),
				]);

				if (rolesRes.success) {
					setRoles(rolesRes.data);

					// Set default role if available
					if (rolesRes.data.length > 0) {
						const adminRole =
							rolesRes.data.find(
								(r) => r.name.toLowerCase() === 'admin',
							) || rolesRes.data[0];
						setSelectedRole(adminRole.id);
					}
				}

				if (teamsRes.success) {
					const mappedTeams = teamsRes.data.map((team) => ({
						value: team.externalId || team.id,
						label: team.name,
					}));
					setTeams(mappedTeams);
				}
			} catch (error) {
				console.error('Failed to fetch roles/teams:', error);
				toast.error('Failed to load roles and teams');
			} finally {
				setLoading(false);
			}
		};

		if (open) {
			fetchData();
		}
	}, [open]);

	// Reset form when drawer closes
	useEffect(() => {
		if (!open) {
			setFullName('');
			setEmail('');
			setSelectedTeams([]);
			setError(null);
		}
	}, [open]);

	const toggleRoleExpand = async (roleId) => {
		const isExpanding = !expandedRoleIds.includes(roleId);

		if (isExpanding) {
			setExpandedRoleIds((prev) => [...prev, roleId]);

			// Fetch permissions if not already loaded
			if (!rolePermissions[roleId]) {
				try {
					setLoadingPermissions((prev) => ({ ...prev, [roleId]: true }));
					const response = await roleService.getRolePermissions(roleId);
					if (response.success) {
						setRolePermissions((prev) => ({
							...prev,
							[roleId]: filterHiddenPermissionsList(response.data),
						}));
					}
				} catch (error) {
					console.error('Failed to fetch role permissions:', error);
					toast.error('Failed to load permissions');
				} finally {
					setLoadingPermissions((prev) => ({ ...prev, [roleId]: false }));
				}
			}
		} else {
			setExpandedRoleIds((prev) => prev.filter((id) => id !== roleId));
		}
	};

	const handleInvite = async () => {
		if (!fullName || !email || !selectedRole || selectedTeams.length === 0) {
			toast.error('Please fill in all required fields');
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const inviteData = {
				fullName,
				email,
				roleId: selectedRole,
				teamIds: selectedTeams,
			};

			const response = await userService.inviteUser(inviteData);

			if (response.success) {
				toast.success('Invitation sent successfully');
				setOpen(false);
				// Reset form
				setFullName('');
				setEmail('');
				setSelectedTeams([]);
				if (onSuccess) onSuccess();
			}
		} catch (error) {
			console.error('Failed to invite user:', error);
			const message =
				error.response?.data?.message || 'Failed to send invitation';
			setError(message);
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

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
							Invite User
						</SheetTitle>
					</SheetHeader>

					{error && (
						<div className="px-6 mb-4">
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>Error</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						</div>
					)}

					<div className="border-t border-[#6A12CD1A] pt-4 px-6 pb-5 space-y-4">
						<InputText
							label="Full Name"
							placeholder="e.g., nilesh anand"
							className="w-full"
							value={fullName}
							setValue={(e) => setFullName(e)}
							required={true}
						/>
						<InputText
							label="Email"
							placeholder="nilesh.anand@irame.ai"
							className="w-full"
							value={email}
							setValue={(e) => setEmail(e)}
							required={true}
						/>

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

					<div className="px-6 h-[calc(100%-30rem)] overflow-auto pb-3">
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
												toggleRoleExpand(role.id);
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
												{loadingPermissions[role.id] ? (
													<div className="px-4 py-8 text-center text-gray-500 text-sm">
														Loading permissions...
													</div>
												) : rolePermissions[role.id]
														?.length > 0 ? (
													rolePermissions[role.id].map(
														(perm, index) => (
															<div
																key={index}
																className="grid grid-cols-2 gap-4 px-4 py-3 bg-white"
															>
																<div className="text-[#26064A] text-xs font-medium">
																	{perm.name}
																</div>
																<div className="text-[#26064ACC] text-xs">
																	{
																		perm.description
																	}
																</div>
															</div>
														),
													)
												) : (
													<div className="px-4 py-8 text-center text-gray-500 text-sm">
														No permissions found
													</div>
												)}
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					</div>

					<div className="absolute bottom-0 left-0 w-full py-4 px-6 flex justify-end border-t border-[#6A12CD1A] bg-white">
						<Button onClick={handleInvite} disabled={loading}>
							{loading ? 'Inviting...' : 'Invite User'}
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
