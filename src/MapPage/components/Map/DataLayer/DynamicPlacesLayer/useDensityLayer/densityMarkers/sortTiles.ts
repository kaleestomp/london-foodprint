import { type TileDensity, type TilePlacePreview } from '../../../../../../request/useRequestTiles/request';

const sortTiles = (
    tiles: TileDensity[],
    checkedTiles: Set<string>,
): {
    densityTiles: TileDensity[];
    singletons: TilePlacePreview[];
} => {
    
    const newTiles = tiles.filter(d => !checkedTiles.has(d.tile));
    if (!newTiles.length) return { densityTiles: [], singletons: [] };

    const densityTiles: TileDensity[] = [];
    const singletons: TilePlacePreview[] = [];
    newTiles.forEach((d) => { 
        checkedTiles.add(d.tile); 
        if (d.count === 1 && d.singleton) singletons.push(d.singleton);
        else densityTiles.push(d);
    });

    return { densityTiles, singletons };
};

export default sortTiles;

