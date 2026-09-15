const STREET_QUERY_KEYWORDS = new RegExp(
	`\\b(?:${[
		'street',
		'st',
		'road',
		'rd',
		'avenue',
		'ave',
		'lane',
		'ln',
		'drive',
		'dr',
		'close',
		'cl',
		'crescent',
		'cres',
		'terrace',
		'ter',
		'way',
		'court',
		// 'ct',
		// 'square',
		// 'sq',
		// 'gardens',
		// 'gdn',
	].join('|')})\\b`,
	'i',
);

export const containsStreetKeyword = (value: string): boolean => (
	STREET_QUERY_KEYWORDS.test(value)
);

export default STREET_QUERY_KEYWORDS;








// const STREET_QUERY_KEYWORDS = /\b(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|close|cl|crescent|cres|terrace|ter|way|court|ct|square|sq|gardens|gdn)\b/i;
