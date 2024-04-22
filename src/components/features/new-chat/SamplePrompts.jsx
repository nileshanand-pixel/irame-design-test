const SamplePrompts = () => {
	return (
		<div className="bg-purple-4 rounded-xl min-w-[19.25rem] max-w-[19.25rem] max-h-[21.75rem] p-4 hover:bg-purple-8">
			<div className="flex items-center p-3 bg-white rounded-[100px] gap-2">
				🔍
				<p className="text-primary80 text-sm font-medium">
					Descriptive Analysis
				</p>
			</div>
			<div className="mt-8 max-h-[15rem] overflow-y-auto text-base text-primary80 ">
				<ul className="divide-y-[24px] divide-transparent">
					<li className="flex items-center gap-2 hover:cursor-pointer hover:text-purple-80 hover:font-medium">
						Suggest beautiful places to see on an upcoming long road trip
					</li>
					<li className="flex items-center gap-2 hover:cursor-pointer hover:text-purple-80 hover:font-medium">
						Suggest beautiful places to see on an upcoming long road trip
					</li>

					<li className="flex items-center gap-2 hover:cursor-pointer hover:text-purple-80 hover:font-medium">
						Suggest beautiful places to see on an upcoming long road trip
					</li>
				</ul>
			</div>
			<div className="text-primary100 font-medium text-base text-right mt-6">
				View more
			</div>
		</div>
	);
};

export default SamplePrompts;
