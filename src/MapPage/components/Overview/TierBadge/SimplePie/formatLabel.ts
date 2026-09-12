const LABEL_FONT_FAMILY = "system-ui, 'Segoe UI', Roboto, sans-serif";

const formatLabel = (
    labelValue: number,
    city: string
) => {
    if (labelValue === 100)
        return {
            text: `{value|All}\n{prefix|Tiers}`,
            rich: {
                value: {
                    fontFamily: LABEL_FONT_FAMILY,
                    fontSize: 20,
                    fontWeight: 700,
                    padding: [0, 0, 0, 0],
                    align: 'center',
                },
                prefix: {
                    fontFamily: LABEL_FONT_FAMILY,
                    fontSize: 11,
                    fontWeight: 400,
                    align: 'center',
                    padding: [0, 0, 2, 0],
                },
            },
        };

    return {
        text: `{prefix|Top}{value|${labelValue}}{percent|%}\n{suffix|${city}}`,
        rich: {
            prefix: {
                fontFamily: LABEL_FONT_FAMILY,
                fontSize: 11,
                fontWeight: 'regular',
                align: 'center',
                padding: [0, 0, 0, 0],
            },
            value: {
                fontFamily: LABEL_FONT_FAMILY,
                padding: [0, 0, 0, 2],
                fontSize: 20,
                fontWeight: 700,
                align: 'center',
            },
            percent: {
                fontFamily: LABEL_FONT_FAMILY,
                fontSize: 11,
                fontWeight: 'bold',
                padding: [0, 0, 0, 0],
                align: 'center',
            },
            suffix: {
                fontFamily: LABEL_FONT_FAMILY,
                fontSize: 11,
                align: 'center',
            },
        },
    };

};

export default formatLabel;
