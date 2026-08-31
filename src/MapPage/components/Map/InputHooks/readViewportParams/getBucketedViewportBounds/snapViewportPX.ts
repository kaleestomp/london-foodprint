const INTERVAL_PX = 10;

const snapUpPX = (value: number, interval: number = INTERVAL_PX): number => (Math.round(value) === 0 ? interval : Number(Math.ceil(value / interval) * interval));
const snapDownPX = (value: number, interval: number = INTERVAL_PX): number => (Math.round(value) === 0 ? interval*-1 : Number(Math.floor(value / interval) * interval));

const snapViewportPX = (
    screen: { left: number, right: number, bottom: number, top: number}, 
    screenMode: 'landscape' | 'portrait' | null
) => {
    const { left, right, bottom, top } = screen;
    return screenMode === 'landscape' 
        ? { left: snapUpPX(left), right: snapDownPX(right), bottom: snapUpPX(bottom), top: snapDownPX(top) }
        : screenMode === 'portrait'
        ? { left: snapDownPX(left), right: snapUpPX(right), bottom: snapDownPX(bottom), top: snapUpPX(top) }
        : { left: snapDownPX(left), right: snapUpPX(right), bottom: snapUpPX(bottom), top: snapDownPX(top) };
}

export default snapViewportPX;