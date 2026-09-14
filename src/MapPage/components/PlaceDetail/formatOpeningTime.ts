import type { OpeningTime } from '../../request/useRequestPlaceDetail/request';
import { minuteToDate, formatTime} from '../../../utils/format/formatTime';

const formatOpeningTime = (
    openingTime: OpeningTime | string | null
): {
    openAt: string;
    closeAt: string;
    isOpen: boolean;
    label: string;
    labelShort: string;
} | null => {

    if (!openingTime) return null;

    // PARSE STRING TO OBJECT
    let parsedObject: OpeningTime;
    try {
        parsedObject = typeof openingTime === 'string'
            ? JSON.parse(openingTime) as OpeningTime
            : openingTime;
    } catch {
        return null;
    }

    // DATETIME CONVERSION
    // The API values are total minutes since midnight: 420 = 07:00.
    const openTime = minuteToDate(parsedObject.open_minute);
    const closeTime = minuteToDate(parsedObject.close_minute);
    if (closeTime <= openTime) closeTime.setDate(closeTime.getDate() + 1);

    const now = new Date();
    const isOpen = now >= openTime && now < closeTime;
    const t60Minutes = 60 * 60 * 1000;
    const openSoon = !isOpen && (openTime.getTime() - now.getTime() <= t60Minutes);
    const closingSoon = isOpen && (closeTime.getTime() - now.getTime() <= t60Minutes);
    const notYetOpen = !isOpen && !openSoon && (openTime.getTime() - now.getTime() > 0);

    const openAt = formatTime(openTime);
    const closeAt = formatTime(closeTime);
    const label = openSoon ? `Open soon · ${openAt}` 
        : closingSoon ? `Close soon · ${closeAt}` 
        : notYetOpen ? `Open at ${openAt}`
        : isOpen ? `Open Now` : `Closed`;
    const labelShort = openSoon ? `Open soon` 
        : closingSoon ? `Close soon` 
        : notYetOpen ? `Open Later`
        : isOpen ? `Open Now` : `Closed`;
    
    const parsed = { openAt, closeAt, isOpen, label, labelShort }
    
    return parsed;
};

export default formatOpeningTime;