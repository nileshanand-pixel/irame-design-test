const Spinner = ({ className, size = 'sm', color = '' }) => {
	return (
		<div
			className={`spinner ${size} ${
				color === 'white' ? 'white' : ''
			} ${className}`}
		>
			<div className="spinner-blade"></div>
			<div className="spinner-blade"></div>
			<div className="spinner-blade"></div>
			<div className="spinner-blade"></div>
			<div className="spinner-blade"></div>
			<div className="spinner-blade"></div>
			<div className="spinner-blade"></div>
			<div className="spinner-blade"></div>
			<div className="spinner-blade"></div>
			<div className="spinner-blade"></div>
			<div className="spinner-blade"></div>
			<div className="spinner-blade"></div>
		</div>
	);
};

export default Spinner;
