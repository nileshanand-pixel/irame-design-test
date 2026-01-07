import dayjs from 'dayjs';

const formatDate = (dateValue) => {
	if (!dateValue) return 'DD-MM-YYYY';

	const date = dayjs(dateValue);

	// Check if date is valid
	if (!date.isValid()) return 'DD-MM-YYYY';

	return date.format('DD-MM-YYYY');
};

export default function DateCell({ value }) {
	return <span className="text-sm text-[#6B7280]">{formatDate(value)}</span>;
}
