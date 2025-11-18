import { Button } from '@/components/ui/button';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from '@/components/ui/sheet';
import plusIcon from '@/assets/icons/plus.svg';
import { useState } from 'react';

export default function CreateTeamCta({ text = 'Create Team' }) {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<Button className="gap-2" onClick={() => setOpen(true)}>
				<img src={plusIcon} className="size-5" />
				{text}
			</Button>

			<SheetContent side="right" className="w-full sm:max-w-md">
				<SheetHeader>
					<SheetTitle>Create New Team</SheetTitle>
					<SheetDescription>
						Fill in the details below to create a new team.
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6">
					{/* Add your form or content here */}
					<p className="text-sm text-muted-foreground">
						Team creation form will go here...
					</p>
				</div>
			</SheetContent>
		</Sheet>
	);
}
