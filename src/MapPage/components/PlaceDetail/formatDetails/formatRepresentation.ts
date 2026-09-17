
const formatRepresentation = (
    repDelta: number | null | undefined,
    repRatio: number | null | undefined,
    localTotal: number | null | undefined,
): string | null => {

    if (repDelta === null || repDelta === undefined || repRatio === null || repRatio === undefined || localTotal === null || localTotal === undefined)
        return null;
    const isOverrepresented = repDelta > 0;
    const competitions = Number(localTotal * repRatio).toFixed(0);
    const noCompetition = Number(competitions) <= 3;
    if (noCompetition) return `This place is unique. There are only ${competitions} / ${localTotal} like it in the immediate area`;
    const isCompetitionHigh = !noCompetition && isOverrepresented;
    const formatted = `Local competition is ${isCompetitionHigh ? 'higher' : 'lower'} than city average, among similar establishments from ${competitions} / ${localTotal} in the immediate area`;
    
    return formatted;
};

export default formatRepresentation;