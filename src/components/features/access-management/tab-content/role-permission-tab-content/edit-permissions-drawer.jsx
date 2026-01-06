import InputText from '@/components/elements/InputText';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import gridIcon from '@/assets/icons/grid.svg';
import { usePermissions } from '@/hooks/use-permissions';
import { useRolePermissionsUpdate } from '@/hooks/use-role-permissions-update';
import { roleService } from '@/api/gatekeeper/role.service';
import { Loader2 } from 'lucide-react';

export default function EditPermissionsDrawer({ open, setOpen, role }) {
	const [roleName, setRoleName] = useState(role?.name || '');
	const [description, setDescription] = useState(role?.description || '');
	const [permissions, setPermissions] = useState({});
	const [originalPermissionIds, setOriginalPermissionIds] = useState([]);
	const [isLoadingRolePermissions, setIsLoadingRolePermissions] = useState(false);

	const { data: permissionsByResource, isLoading: isLoadingPermissions } =
		usePermissions();
	const updateRoleMutation = useRolePermissionsUpdate();

	useEffect(() => {
		if (open && role?.id) {
			setRoleName(role.name || '');
			setDescription(role.description || '');
			fetchRolePermissions();
		}
	}, [open, role]);

	const fetchRolePermissions = async () => {
		setIsLoadingRolePermissions(true);
		try {
			const res = await roleService.getRolePermissions(role.id);
			if (res.success) {
				const permsMap = {};
				const ids = res.data.map((p) => {
					permsMap[p.id] = true;
					return p.id;
				});
				setPermissions(permsMap);
				setOriginalPermissionIds(ids);
			}
		} catch (error) {
			console.error('Failed to fetch role permissions:', error);
		} finally {
			setIsLoadingRolePermissions(false);
		}
	};

	const handlePermissionToggle = (permissionId) => {
		setPermissions((prev) => ({
			...prev,
			[permissionId]: !prev[permissionId],
		}));
	};

	const handleUpdateRole = async () => {
		const currentSelectedIds = Object.keys(permissions).filter(
			(id) => permissions[id],
		);

		const add = currentSelectedIds.filter(
			(id) => !originalPermissionIds.includes(id),
		);
		const remove = originalPermissionIds.filter(
			(id) => !currentSelectedIds.includes(id),
		);

		try {
			await updateRoleMutation.mutateAsync({
				roleId: role.id,
				name: roleName !== role.name ? roleName : undefined,
				description:
					description !== role.description ? description : undefined,
				add,
				remove,
			});
			setOpen(false);
		} catch (error) {
			// Error handled by hook
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
							Edit Role Permissions
						</SheetTitle>
					</SheetHeader>

					<div className="border-t border-[#6A12CD1A] pt-4 px-6 pb-5 space-y-4">
						<InputText
							label="Role Name"
							placeholder="e.g., nilesh anand"
							className="w-full"
							value={roleName}
							setValue={(e) => setRoleName(e)}
							required={true}
						/>

						<div className="space-y-2">
							<label className="text-sm font-medium text-[#26064A]">
								Description
							</label>
							<Textarea
								placeholder="Enter a description..."
								className="w-full min-h-[6rem] text-sm border-gray-300 resize-none"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>
					</div>

					<div className="border-t border-[#6A12CD1A] py-4 px-6">
						<div className="text-[#26064A] text-base font-medium">
							Review role permissions
						</div>
					</div>

					<div className="px-6 h-[calc(100%-28rem)] overflow-hidden">
						<div className="bg-[#F9F5FF] rounded-lg border border-[#6A12CD1A] overflow-hidden h-full">
							<div className="grid grid-cols-2 gap-4 px-4 py-3 bg-[#F9F5FF] border-b border-[#6A12CD1A]">
								<div className="flex items-center gap-2">
									<img src={gridIcon} className="size-4" />
									<span className="text-[#26064A] font-semibold text-xs">
										Resources
									</span>
								</div>
								<div className="text-[#26064A] font-semibold text-xs text-right">
									Permission
								</div>
							</div>

							<div className="bg-white h-[calc(100%-2.125rem)] overflow-auto">
								{isLoadingPermissions || isLoadingRolePermissions ? (
									<div className="flex justify-center items-center h-full">
										<Loader2 className="animate-spin text-purple-600 h-8 w-8" />
									</div>
								) : (
									Object.entries(
										permissionsByResource?.data || {},
									).map(([category, categoryPermissions]) => (
										<div key={category}>
											<div className="border-b border-[#6A12CD1A]">
												<div className="px-4 py-3 text-[#26064A] font-medium text-sm bg-[#6A12CD05] border border-[#6A12CD1A] capitalize">
													{category}
												</div>
											</div>

											{categoryPermissions?.map(
												(permission) => (
													<div
														key={permission.id}
														className="grid grid-cols-2 gap-4 px-4 py-2 border-b border-[#6A12CD1A] last:border-b-0"
													>
														<div>
															<div className="text-[#26064A] font-medium text-sm">
																{permission.action}
															</div>
															<div className="text-[#26064A99] text-xs mt-0.5">
																{
																	permission.description
																}
															</div>
														</div>
														<div className="flex items-center justify-end">
															<Switch
																checked={
																	permissions[
																		permission.id
																	] || false
																}
																onCheckedChange={() =>
																	handlePermissionToggle(
																		permission.id,
																	)
																}
															/>
														</div>
													</div>
												),
											)}
										</div>
									))
								)}
							</div>
						</div>
					</div>

					<div className="absolute bottom-0 left-0 w-full">
						<div className="py-4 px-6 flex justify-end border-t border-[#6A12CD1A] bg-white">
							<Button
								onClick={handleUpdateRole}
								disabled={
									updateRoleMutation.isLoading || !roleName.trim()
								}
							>
								{updateRoleMutation.isLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Update Role
							</Button>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
