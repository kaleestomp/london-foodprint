export const SAMPLE_DATA = {
    name: 'Materials',
    children: [
        {
            name: 'Concrete',
            children: [
                { name: 'Precast', value: 120 },
                { name: 'In-situ', value: 95 },
                { name: 'Lightweight', value: 60 },
            ],
        },
        {
            name: 'Steel',
            collapsed: true,
            children: [
                { name: 'Structural', value: 210 },
                { name: 'Rebar', value: 80 },
                { name: 'Stainless', value: 150 },
            ],
        },
        {
            name: 'Timber',
            children: [
                { name: 'Glulam', value: 45 },
                { name: 'CLT', value: 38 },
            ],
        },
        {
            name: 'Aluminium',
            collapsed: true,
            children: [
                { name: 'Extruded', value: 190, 
                    children: [
                        { name: 'Extruded', value: 190 },
                        { name: 'Cast', value: 160 },
                    ] 
                },
                { name: 'Cast', value: 160 },
            ],
        }, 
    ],
};