export type StatusKey = 'Accepted' | 'Not Accepted' | 'Archived' | 'Pending';

interface StatusEntry {
    letter: string;
    color: string;
}

const STATUS_MAP: Record<StatusKey, StatusEntry> = {
    'Accepted':     { letter: 'P', color: '#618833' },
    'Not Accepted': { letter: 'F', color: 'rgb(190, 10, 38)' },
    'Archived':     { letter: 'F', color: 'rgb(120, 120, 120)' },
    'Pending':      { letter: 'N', color: 'rgb(31, 130, 192)' },
};

export default STATUS_MAP;
