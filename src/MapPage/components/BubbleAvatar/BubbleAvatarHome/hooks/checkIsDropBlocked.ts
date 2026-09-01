const checkIsDropBlocked = (
    point: {x: number, y: number},
    isMobile: boolean,
    drawerSnapPX: number,
) => {
    if (!isMobile || !drawerSnapPX) return false;

    const panelTopY = Math.max(0, window.innerHeight - drawerSnapPX);
    const panelBottomY = panelTopY + drawerSnapPX;

    return (
        point.x >= 0 &&
        point.x <= window.innerWidth &&
        point.y >= panelTopY &&
        point.y <= panelBottomY
    );
};

export default checkIsDropBlocked;