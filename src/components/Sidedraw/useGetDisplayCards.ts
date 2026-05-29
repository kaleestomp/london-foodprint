// import { useState, useMemo } from 'react'; 

// import useRequestSnap from '../../request/useRequestSnap/useRequestSnap';
// import useElementSize from '../../utils/styling/observer'; 

// const ROW_HEIGHT = 140; 

export interface DisplayCard {
    id: number;
    StartTime: string;
    EndTime: string;
    Files: string[];
    Zones: string[];
    SimIDs: string[];
    SimCounts: string[];
    NoOfLifts: string[];
    QL: string[];
    AWT: string[];
    ATT: string[];
    Status: string;
    Building: string;
    Asset: string;
    TimeCategory: string;
    Population: string | number;
    Incoming: string | number;
    Outgoing: string | number;
    Interfloor: string | number;
    CarType: string;
    [key: string]: unknown;
}

const useGetDisplayCards = () => { 

    // const { snap, isLoading } = useRequestSnap(); 
    // const cards = useMemo((): DisplayCard[] => {
    //     if (isLoading) return []; 
    //     return snap.map((item: Record<string, unknown>) => ({
    //         ...item, 
    //         StartTime: (item.StartTime as string).slice(0, 5), 
    //         EndTime: (item.EndTime as string).slice(0, 5), 
    //         Files: (item.File as string).split('|%|'), 
    //         Zones: (item.Zone as string).split('|%|'), 
    //         SimIDs: (item.SimID as string).split('|%|'), 
    //         SimCounts: (item.SimCount as string).split('|%|'), 
    //         NoOfLifts: (item.NoOfLifts as string).split('|%|'), 
    //         QL: (item.QL as string).split('|%|'), 
    //         AWT: (item.AWT as string).split('|%|'),  
    //         ATT: (item.ATT as string).split('|%|'), 
    //     })) as DisplayCard[];
    // }, [snap, isLoading]);
    
    // const [rangeStart, setRangeStart] = useState(0); 
    // const { containerRef, size } = useElementSize(); 
    // const rowCount = useMemo(() => Math.max(Math.round((size.height - 62 - 90) / ROW_HEIGHT), 4), [size.height]); 
    // const displayCards = useMemo(() => isLoading ? [] : cards.slice(rangeStart, rangeStart + rowCount), [cards, isLoading, rangeStart, rowCount]); 

    // return { 
    //     displayCards, 
    //     itemCount: isLoading ? 0 : snap.length, 
    //     rowCount, 
    //     isLoading, 
    //     containerRef, 
    //     setRangeStart, 
    // };
}

export default useGetDisplayCards;
