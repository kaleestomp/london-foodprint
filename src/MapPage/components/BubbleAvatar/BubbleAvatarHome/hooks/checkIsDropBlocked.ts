import { type Point } from '../../config';

const checkIsDropBlocked = (
    point: Point,
    isMobile: boolean,
    panelHeight: number,
    translateY: number,
) => {
    if (!isMobile) return false;

    const safePanelHeight = Math.max(0, panelHeight);
    const panelTop = Math.max(0, window.innerHeight - safePanelHeight + Math.max(0, translateY));
    const panelBottom = panelTop + safePanelHeight;

    return (
        point.x >= 0 &&
        point.x <= window.innerWidth &&
        point.y >= panelTop &&
        point.y <= panelBottom
    );
};

export default checkIsDropBlocked;