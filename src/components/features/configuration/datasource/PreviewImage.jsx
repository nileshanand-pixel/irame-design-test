export default function PreviewImage({ url }) {
	return (
		<div>
			<img src={url} alt="Image" className="w-full" />
		</div>
	);
}
