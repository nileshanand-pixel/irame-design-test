import InputText from '@/components/elements/InputText';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import { useRolePermissionsUpdate } from '@/hooks/use-role-permissions-update';
import { roleService } from '@/api/gatekeeper/role.service';
import { Loader2 } from 'lucide-react';
import PermissionsAccordion from './permissions-accordion';

export default function EditPermissionsDrawer({
	open,
	setOpen,
	role,
	isReadOnly = false,
}) {
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

	// Get the first category key to set as default open
	const firstCategoryKey = Object.keys(permissionsByResource?.data || {})[0];

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
							{isReadOnly ? 'View' : 'Edit'} Role Permissions
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
							disabled={isReadOnly}
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
								disabled={isReadOnly}
							/>
						</div>
					</div>

					<PermissionsAccordion
						permissions={permissions}
						setPermissions={setPermissions}
						permissionsByResource={permissionsByResource?.data}
						defaultOpenCategory={firstCategoryKey}
						isLoading={isLoadingPermissions || isLoadingRolePermissions}
						readOnly={isReadOnly}
					/>

					{!isReadOnly && (
						<div className="absolute bottom-0 left-0 w-full">
							<div className="py-4 px-6 flex justify-end border-t border-[#6A12CD1A] bg-white">
								<Button
									onClick={handleUpdateRole}
									disabled={
										updateRoleMutation.isLoading ||
										!roleName.trim()
									}
								>
									{updateRoleMutation.isLoading ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : null}
									Update Role
								</Button>
							</div>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
