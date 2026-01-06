import InputText from '@/components/elements/InputText';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { updateTeam } from '@/api/gatekeeper/team.service';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function EditTeamDrawer({ open, setOpen, team }) {
	const queryClient = useQueryClient();
	const [teamName, setTeamName] = useState(team?.teamName || '');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (team?.teamName) {
			setTeamName(team.teamName);
		}
	}, [team]);

	const handleUpdateTeam = async () => {
		if (!teamName.trim()) {
			toast.error('Team name is required');
			return;
		}

		if (teamName.trim() === team?.teamName) {
			setOpen(false);
			return;
		}

		setIsSubmitting(true);
		try {
			await updateTeam(team.id, {
				name: teamName.trim(),
			});
			toast.success('Team updated successfully');
			queryClient.invalidateQueries(['teams']);
			setOpen(false);
		} catch (error) {
			console.error('Error updating team:', error);
			toast.error(error?.response?.data?.message || 'Failed to update team');
		} finally {
			setIsSubmitting(false);
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
							Edit Team
						</SheetTitle>
					</SheetHeader>

					<div className="border-y border-[#6A12CD1A] pt-4 px-6 pb-5">
						<InputText
							label="Team Name"
							placeholder="Enter unique team name"
							className="w-full"
							value={teamName}
							setValue={(e) => setTeamName(e)}
							required={true}
						/>
					</div>

					<div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg mt-4 mx-6 p-[0.625rem] flex items-start gap-2">
						<div className="text-sm text-[#1E40AF] font-medium">
							Note:
						</div>
						<div className="text-xs text-[#1E40AF]">
							Changing the team name will update it across all systems.
							Team members will be notified of this change.
						</div>
					</div>

					<div className="w-full absolute bottom-0 left-0 py-4 px-6 flex justify-end border-t border-[#6A12CD1A]">
						<Button onClick={handleUpdateTeam} disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Updating...
								</>
							) : (
								'Update Team'
							)}
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
