const CircularLoader = ({ className, size }) => {
	const classNameMap = {
		sm: 'border-[0.125rem] size-4',
		md: 'border-4 size-6',
		lg: 'border-[0.375rem] size-8',
		xl: 'border-[0.5rem] size-10',
	};
	return (
		<div
			class={`border-gray-300 ${size && classNameMap[size]} animate-spin rounded-full border-2 border-t-purple-80 ${className}`}
		/>
	);
};

export default CircularLoader;
