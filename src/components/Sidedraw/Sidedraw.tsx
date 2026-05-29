import { useAppUI } from '../../context/AppUIContext'; 
import SidedrawHeader from './SidedrawHeader/SidedrawHeader';
// import Catalogue from './Catalogue/Catalogue'; 
// import SidedrawFooter from './SidedrawFooter/SidedrawFooter'; 
// import useGetDisplayCards from './useGetDisplayCards'; 

// import Skeleton from '@mui/material/Skeleton'; 
// import Box from '@mui/material/Box';
// import Fade from '@mui/material/Fade'; 
import Divider from '@mui/material/Divider';
import './Sidedraw.css';

const Sidedraw = () => {
    const { isSidedrawOpen } = useAppUI(); 
    // const { displayCards, itemCount, rowCount, isLoading, containerRef, setRangeStart } = useGetDisplayCards();

    return (
        <aside //ref={containerRef} 
            className={`app-sidedraw${isSidedrawOpen ? ' is-open' : ''}`}
            aria-label="Page 1 utility sidebar"
            aria-hidden={!isSidedrawOpen}
        >
            {isSidedrawOpen && <>
                {/* <Fade in={isLoading} unmountOnExit>
                    <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none'}}>
                        <Skeleton variant="rounded" animation="wave" sx={{ width: '100%', height: '100%' }} />
                    </Box>
                </Fade> */}
                <SidedrawHeader />
                <Divider />
                <div className="sidedraw-content-block">
                    {/* <Catalogue cards={displayCards} /> */}
                </div>
                <Divider />
                <div className="sidedraw-footer-block">
                    {/* <SidedrawFooter 
                        itemCount={itemCount} 
                        rowCount={rowCount} 
                        setRangeStart={setRangeStart}
                    /> */}
                </div>
            </>}
        </aside> 
    )
};

export default Sidedraw;
