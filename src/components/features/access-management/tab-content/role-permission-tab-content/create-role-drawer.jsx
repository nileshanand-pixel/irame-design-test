import InputText from '@/components/elements/InputText';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import redInfoIcon from '@/assets/icons/red-info.svg';
import { usePermissions } from '@/hooks/use-permissions';
import { useRoleCreate } from '@/hooks/use-role-create';
import { Loader2 } from 'lucide-react';
import PermissionsAccordion from './permissions-accordion';

export default function CreateRoleDrawer({ open, setOpen }) {
	const [roleName, setRoleName] = useState('');
	const [description, setDescription] = useState('');
	const [permissions, setPermissions] = useState({});

	const { data: permissionsByResource, isLoading: isLoadingPermissions } =
		usePermissions();
	const createRoleMutation = useRoleCreate();

	const handleCreateRole = async () => {
		if (!roleName.trim()) {
			return;
		}

		const selectedPermissionIds = Object.keys(permissions).filter(
			(id) => permissions[id],
		);

		try {
			await createRoleMutation.mutateAsync({
				name: roleName,
				description,
				permissionIds: selectedPermissionIds,
			});
			setOpen(false);
			setRoleName('');
			setDescription('');
			setPermissions({});
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
							Create New Role
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

					<PermissionsAccordion
						permissions={permissions}
						setPermissions={setPermissions}
						permissionsByResource={permissionsByResource?.data}
						title="Set permissions for this role"
						isLoading={isLoadingPermissions}
					/>

					<div className="absolute bottom-0 left-0 w-full">
						<div className="flex justify-center gap-2 items-center bg-white py-1 px-3 rounded-t-2xl border border-[#F0E7FA]">
							<img src={redInfoIcon} className="size-4" />

							<div className="text-[#C73A3A] text-xs">
								These permissions can be modified later from the role
								edit page.
							</div>
						</div>
						<div className="py-4 px-6 flex justify-end border-t border-[#6A12CD1A] bg-white">
							<Button
								onClick={handleCreateRole}
								disabled={
									createRoleMutation.isLoading || !roleName.trim()
								}
							>
								{createRoleMutation.isLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Create Role
							</Button>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
