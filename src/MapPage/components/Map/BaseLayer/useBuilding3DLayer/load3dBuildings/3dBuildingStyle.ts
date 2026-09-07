const buildingStyle = {
  "id": "Building 3D",
  "type": "fill-extrusion",
  "source": "buildings",
  "source-layer": "building",
  "minzoom": 14,
  "layout": {
    "visibility": "none"
  },
  "paint": {
    "fill-extrusion-base": {
      "property": "height_min",
      "type": "identity"
    },
    "fill-extrusion-height": {
      "property": "height",
      "type": "identity"
    },
    "fill-extrusion-opacity": [
      "interpolate",
      [
        "linear"
      ],
      [
        "zoom"
      ],
      18,
      0.8,
      20,
      0.6
    ],
    "fill-extrusion-color": {
      "stops": [
        [
          13,
          "hsl(48,25%,73%)"
        ],
        [
          16,
          "hsl(47,32%,77%)"
        ]
      ]
    },
    "fill-extrusion-pattern": "red",
    "fill-extrusion-vertical-gradient": false
  },
  "filter": [
    "all",
    [
      "==",
      [
        "geometry-type"
      ],
      "Polygon"
    ],
    [
      "any",
      [
        "==",
        [
          "get",
          "underground"
        ],
        false
      ],
      [
        "!",
        [
          "has",
          "underground"
        ]
      ]
    ]
  ]
};

export default buildingStyle;