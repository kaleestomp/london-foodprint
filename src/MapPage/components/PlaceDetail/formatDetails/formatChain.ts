
const formatChain = (
    name: string | null | undefined,
    count: number | null | undefined,
    isMajor?: boolean | null | undefined,
): string | null => {

    if (!name )
        return null;
    const formatted = 
        `${name} is a ${isMajor ? 'major' : ''} chain with ${count} branches in the city`

    return formatted;
};

export default formatChain;