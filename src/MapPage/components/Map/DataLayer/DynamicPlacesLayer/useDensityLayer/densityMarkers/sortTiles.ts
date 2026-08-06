import { type TileDensity } from '../../../../../../request/useRequestTiles/request';

const sortTiles = ( tiles: TileDensity[] ) : {
    densityTiles: TileDensity[];
    singletons: TileDensity[];
} => {

    const densityTiles: TileDensity[] = [];
    const singletons: TileDensity[] = [];
    tiles.forEach((d) => { 
        if (d.count === 1 && d.singleton) singletons.push(d);
        else densityTiles.push(d);
    });

    return { densityTiles, singletons };
};

export default sortTiles;

