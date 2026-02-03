import { Label } from '@/components/ui/label';

export const RequiredLabel = ({ children, required = true }) => (
	<Label className="text-sm text-primary80 flex items-center gap-0.5">
		{children}
		{required && <span className="text-red-600">*</span>}
	</Label>
);
