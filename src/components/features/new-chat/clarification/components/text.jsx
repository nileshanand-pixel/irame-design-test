export default function Text({ data }) {
	return (
		<div className="mb-2">
			<p
				className="text-primary80 font-medium cursor-default"
				style={{ whiteSpace: 'pre-wrap' }}
				dangerouslySetInnerHTML={{
					__html: data?.tool_data?.text,
				}}
			></p>
		</div>
	);
}
