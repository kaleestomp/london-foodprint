const snapToPX = (snap: number | string | null) => {
    if (typeof snap === 'number') {
        return window.innerHeight * snap;
    } else if (typeof snap === 'string' && snap.endsWith('px')) {
        return parseFloat(snap);
    } else return null;
};

export default snapToPX;