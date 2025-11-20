import InputText from '@/components/elements/InputText';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import redInfoIcon from '@/assets/icons/red-info.svg';
import gridIcon from '@/assets/icons/grid.svg';

const PERMISSIONS_DATA = [
	{
		category: 'Business Process',
		permissions: [
			{
				id: 'bp-view',
				label: 'View',
				description: 'View business process and their details',
			},
			{
				id: 'bp-create-update',
				label: 'Create and Update',
				description: 'Build and updates business processes',
			},
			{
				id: 'bp-delete',
				label: 'Delete',
				description: 'Remove workflows permanently',
			},
			{
				id: 'bp-sharing',
				label: 'Sharing Permission',
				description: 'Share workflows with specific users and team',
			},
		],
	},
	{
		category: 'Workflows',
		permissions: [
			{
				id: 'wf-view',
				label: 'View',
				description: 'View workflow & their details',
			},
			{
				id: 'wf-create',
				label: 'Create',
				description: 'Can create new workflows',
			},
			{
				id: 'wf-update',
				label: 'Update',
				description: 'Modify existing workflows',
			},
			{
				id: 'wf-delete',
				label: 'Delete',
				description: 'Delete workflows',
			},
			{
				id: 'wf-view-output',
				label: 'View Output',
				description: 'View workflows',
			},
			{
				id: 'wf-run',
				label: 'Run',
				description: 'View workflows',
			},
			{
				id: 'wf-integrate-data',
				label: 'Integrate Data',
				description: 'View workflows',
			},
		],
	},
	{
		category: 'Reports',
		permissions: [
			{
				id: 'rp-view',
				label: 'View',
				description: 'View workflows',
			},
			{
				id: 'rp-add-queries',
				label: 'Add Queries',
				description: 'View workflows',
			},
			{
				id: 'rp-comment',
				label: 'Comment on Queries',
				description: 'Edit workflows',
			},
			{
				id: 'rp-upload-data',
				label: 'Upload New Data',
				description: 'Delete workflows',
			},
			{
				id: 'rp-attach-proofs',
				label: 'Attach Proofs',
				description: 'Share workflows',
			},
			{
				id: 'rp-share-publish',
				label: 'Share/Publish',
				description: 'Export workflows',
			},
			{
				id: 'rp-delete-queries',
				label: 'Delete Queries',
				description: 'Delete workflows',
			},
		],
	},
	{
		category: 'Dashboard',
		permissions: [
			{
				id: 'db-view',
				label: 'View',
				description: 'Manage projects',
			},
			{
				id: 'db-add-queries',
				label: 'Add Queries',
				description: 'Analyze data',
			},
			{
				id: 'db-publish-queries',
				label: 'Publish Queries',
				description: 'User feedback',
			},
			{
				id: 'db-delete-queries',
				label: 'Delete Queries',
				description: 'Optimize processes',
			},
			{
				id: 'db-comment',
				label: 'Comment on Queries',
				description: 'Team collaboration',
			},
		],
	},
	{
		category: 'Customer Support',
		permissions: [
			{
				id: 'cs-manually-upload',
				label: 'Manually Upload',
				description: 'Team collaboration',
			},
			{
				id: 'cs-live-datasource',
				label: 'Live Datasource List',
				description: 'Project management',
			},
			{
				id: 'cs-data-filters',
				label: 'Data Level Filters',
				description: 'User feedback',
			},
		],
	},
	{
		category: 'Admin',
		permissions: [
			{
				id: 'ad-compliance-logs',
				label: 'Compliance Logs',
				description: 'User feedback',
			},
			{
				id: 'ad-usages',
				label: 'Usages Listing',
				description: 'Feature request',
			},
			{
				id: 'ad-billing',
				label: 'Bill & Payments',
				description: 'Bug report',
			},
			{
				id: 'ad-internal-tech',
				label: 'Internal Tech Specialist',
				description: 'Usability improvement',
			},
			{
				id: 'ad-external-tech',
				label: 'External Tech Specialist',
				description: 'Performance issue',
			},
		],
	},
];

export default function CreateRoleDrawer({ open, setOpen, role }) {
	const [roleName, setRoleName] = useState('');
	const [description, setDescription] = useState('');
	const [permissions, setPermissions] = useState({});

	const handlePermissionToggle = (permissionId) => {
		setPermissions((prev) => ({
			...prev,
			[permissionId]: !prev[permissionId],
		}));
	};

	const handleCreateRole = () => {
		// TODO: Implement create role functionality
		console.log('Creating role:', { roleName, description, permissions });
		setOpen(false);
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
							Clone Role - {role?.roleName}
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

					<div className="px-6 h-[calc(100%-29.5rem)] overflow-hidden">
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
								{PERMISSIONS_DATA.map((section) => (
									<div key={section.category}>
										<div className="border-b border-[#6A12CD1A]">
											<div className="px-4 py-3 text-[#26064A] font-medium text-sm bg-[#6A12CD05] border border-[#6A12CD1A]">
												{section.category}
											</div>
										</div>

										{section?.permissions?.map((permission) => (
											<div
												key={permission.id}
												className="grid grid-cols-2 gap-4 px-4 py-2 border-b border-[#6A12CD1A] last:border-b-0"
											>
												<div>
													<div className="text-[#26064A] font-medium text-sm">
														{permission.label}
													</div>
													<div className="text-[#26064A99] text-xs mt-0.5">
														{permission.description}
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
										))}
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="absolute bottom-0 left-0 w-full">
						<div className="flex justify-center gap-2 items-center bg-white py-1 px-3 rounded-t-2xl border border-[#F0E7FA]">
							<img src={redInfoIcon} className="size-4" />

							<div className="text-[#C73A3A] text-xs">
								These permissions can be modified later from the role
								edit page.
							</div>
						</div>
						<div className="py-4 px-6 flex justify-end border-t border-[#6A12CD1A] bg-white">
							<Button onClick={handleCreateRole}>Clone Role</Button>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
