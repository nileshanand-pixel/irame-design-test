import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import gridIcon from '@/assets/icons/grid.svg';

export default function PermissionsAccordion({
	permissions,
	setPermissions,
	permissionsByResource,
	defaultOpenCategory,
	title = 'Review role permissions',
	isLoading = false,
}) {
	const handlePermissionToggle = (permissionId) => {
		setPermissions((prev) => ({
			...prev,
			[permissionId]: !prev[permissionId],
		}));
	};

	// Get the first category key if no default provided
	const firstCategoryKey = Object.keys(permissionsByResource || {})[0];
	const effectiveDefaultOpen = defaultOpenCategory || firstCategoryKey;

	return (
		<>
			<div className="border-t border-[#6A12CD1A] py-4 px-6">
				<div className="text-[#26064A] text-base font-medium">{title}</div>
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
						{isLoading ? (
							<div className="flex justify-center items-center h-full">
								<Loader2 className="animate-spin text-purple-600 h-8 w-8" />
							</div>
						) : (
							<Accordion
								type="single"
								collapsible
								defaultValue={effectiveDefaultOpen}
							>
								{Object.entries(permissionsByResource || {}).map(
									([category, categoryPermissions]) => {
										const enabledCount =
											categoryPermissions?.filter(
												(p) => permissions[p.id],
											).length || 0;
										const totalCount =
											categoryPermissions?.length || 0;

										return (
											<AccordionItem
												key={category}
												value={category}
												className="border-[#6A12CD1A]"
											>
												<AccordionTrigger className="px-4 py-3 text-[#26064A] font-medium text-sm bg-[#6A12CD05] border border-[#6A12CD1A] hover:bg-[#6A12CD0A] transition-colors [&[data-state=open]]:rounded-t-md gap-2">
													<div className="flex items-center gap-1 w-full capitalize">
														<span className="text-[#26064A]">
															{category}
														</span>
														<span className="ml-auto text-xs -mt-1 text-[#26064A99]">
															{enabledCount}/
															{totalCount} Permissions
														</span>
													</div>
												</AccordionTrigger>
												<AccordionContent className="border-l border-r border-[#6A12CD1A] bg-white">
													{categoryPermissions?.map(
														(permission) => (
															<div
																key={permission.id}
																className="grid grid-cols-2 gap-4 px-4 py-2 border-b border-[#6A12CD1A] last:border-b-0 hover:bg-gray-50"
															>
																<div>
																	<div className="text-[#26064A] font-medium text-sm">
																		{
																			permission.action
																		}
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
																				permission
																					.id
																			] ||
																			false
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
												</AccordionContent>
											</AccordionItem>
										);
									},
								)}
							</Accordion>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
