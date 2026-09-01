// Inject <meta name="theme-color" content="#f8f8f8" />
const assignBrowserThemeColor = () => {

    const paperColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--app-paper-color')
        .trim();

    if (!paperColor) {
        return;
    }

    let themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

    if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        document.head.appendChild(themeColorMeta);
    }

    themeColorMeta.content = paperColor;
};

export default assignBrowserThemeColor;