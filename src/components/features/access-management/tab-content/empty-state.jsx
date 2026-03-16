export default function EmptyState({ config }) {
	return (
		<div className="w-full h-full flex flex-col justify-center gap-4 text-center border border-[#0000001A] rounded-xl shadow-sm">
			<div className="flex justify-center">
				<img src={config?.image} className="w-[21.375rem] h-[18.75rem]" />
			</div>
			<div className="flex flex-col gap-2">
				<div className="text-[#26064A] text-xl font-semibold">
					{config.heading}
				</div>
				<div className="text-[#26064ACC]">
					{config.descriptionLines?.map((line) => {
						return <div key={line}>{line}</div>;
					})}
				</div>
			</div>

			<div>{config?.cta && <config.cta text={config.ctaText} />}</div>
		</div>
	);
}
