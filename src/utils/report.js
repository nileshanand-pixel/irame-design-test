const wordsPerMinute = 200;

export const calculateReadTime = (text) => {
	const cleanText = text.replace(/<\/?[^>]+(>|$)/g, '');
	const wordCount = cleanText.trim().split(/\s+/).length;
	return Math.ceil(wordCount / wordsPerMinute);
};
