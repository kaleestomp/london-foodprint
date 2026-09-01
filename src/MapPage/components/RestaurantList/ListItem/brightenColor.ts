const brightenColor = (
    color: string, 
    amount = 0.28
): string => {
    const rgb = color.match(/\d+/g)?.map(Number);
    if (!rgb || rgb.length < 3) return color;

    const [r, g, b] = rgb;
    const mixChannel = (channel: number): number => Math.round(channel + (255 - channel) * amount);

    return `rgb(${mixChannel(r)}, ${mixChannel(g)}, ${mixChannel(b)})`;
};

export default brightenColor;