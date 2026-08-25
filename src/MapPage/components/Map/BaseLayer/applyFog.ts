const apply3DFogVisibility = (map: maplibregl.Map): void => {
  // This MapLibre build has no setFog API; use sky fog blending instead.
  const isPitched3D = map.getPitch() > 0;

  map.setSky({
    'sky-horizon-blend': isPitched3D ? 0.18 : 0.08,
    'sky-color': '#d9e4ea',
    'horizon-color': '#b8cad7',
    'fog-color': isPitched3D ? '#d6e2ea' : '#dce6ee',
    'fog-ground-blend': isPitched3D ? 0.82 : 0.08,
    'horizon-fog-blend': isPitched3D ? 0.28 : 0.12,
  });
};

export default apply3DFogVisibility;