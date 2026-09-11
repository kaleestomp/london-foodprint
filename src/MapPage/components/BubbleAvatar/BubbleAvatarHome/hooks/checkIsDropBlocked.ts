const checkIsDropBlocked = (
    point: {x: number, y: number},
    isMobile: boolean,
    drawerSnapPX: number | null,
) => {
    if (!isMobile) return false;

    const drawer = document.querySelector<HTMLElement>('.base-ui-drawer-body');
    const drawerRect = drawer?.getBoundingClientRect();
    const panelTopY = drawerRect?.top ?? (
        drawerSnapPX ? Math.max(0, window.innerHeight - drawerSnapPX) : window.innerHeight
    );
    const panelBottomY = drawerRect?.bottom ?? window.innerHeight;
    const panelLeftX = drawerRect?.left ?? 0;
    const panelRightX = drawerRect?.right ?? window.innerWidth;

    return (
        point.x >= panelLeftX &&
        point.x <= panelRightX &&
        point.y >= panelTopY &&
        point.y <= panelBottomY
    );
};

export default checkIsDropBlocked;