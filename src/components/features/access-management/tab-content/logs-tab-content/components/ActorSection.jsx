import { User, Settings, Wrench } from 'lucide-react';

const getActorIcon = (actorType) => {
	switch (actorType) {
		case 'system':
			return <Settings className="size-4 text-[#6A12CD]" />;
		case 'service':
			return <Wrench className="size-4 text-[#6A12CD]" />;
		case 'user':
		default:
			return <User className="size-4 text-[#6A12CD]" />;
	}
};

export default function ActorSection({ log, hideWrapper = false }) {
	const actor = log.actor || {};
	const actorType = actor.type || 'user';

	const content = (
		<div className="flex items-start gap-3">
			<div className="flex-shrink-0 mt-0.5">{getActorIcon(actorType)}</div>
			<div className="flex-1 min-w-0">
				<div className="text-sm text-[#26064A] font-medium">
					{actor.name || 'Unknown'}
				</div>
				{actor.email && (
					<div className="text-xs text-[#26064A99] mt-0.5">
						{actor.email}
					</div>
				)}
				<div className="text-xs text-[#26064A99] mt-1 capitalize">
					{actorType}
				</div>
			</div>
		</div>
	);

	if (hideWrapper) return content;

	return (
		<div className="border border-[#E6E2E9] bg-purple-4 rounded-lg p-4 space-y-3">
			<div className="text-sm font-semibold text-[#26064A]">Performed By</div>
			{content}
		</div>
	);
}
