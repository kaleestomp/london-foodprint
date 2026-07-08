
export const describeTier = (tier: number) => {
    switch (tier) {
        case 1:
            return "50";
        case 2:
            return "25";
        case 3:
            return "10";
        case 4:
            return "5";
        default:
            return "?";
    }
}