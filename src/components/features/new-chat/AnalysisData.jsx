import SamplePrompts from './SamplePrompts';

const AnalysisData = () => {
	return (
		<div className="w-full overflow-x-scroll flex gap-4">
			{[...Array(5)].map((_, index) => (
				<SamplePrompts key={index} />
			))}
		</div>
	);
};

export default AnalysisData;
