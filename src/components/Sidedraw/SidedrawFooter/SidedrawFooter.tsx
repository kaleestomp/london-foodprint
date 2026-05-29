import { useState } from 'react';
import { TablePagination } from '@mui/material';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import './SidedrawFooter.css'; 

interface SidedrawFooterProps {
    itemCount: number;
    rowCount: number;
    setRangeStart: (start: number) => void;
}

const SidedrawFooter = ({ itemCount, rowCount, setRangeStart }: SidedrawFooterProps) => { 
    
    const [page, setPage] = useState(0); 
    const handleChangePage = (_event: unknown, newPage: number) => { 
        setPage(newPage); 
        setRangeStart(newPage * rowCount); 
    }; 

    return (
        <div className="sidedraw-footer-container">
            { itemCount ? <TablePagination 
                component="div" 
                count={itemCount} 
                page={page} 
                onPageChange={handleChangePage} 
                rowsPerPageOptions={[]} 
                rowsPerPage={rowCount} 
            /> : (
                <Box className="sidedraw-footer-skeleton-row">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <Skeleton
                            key={idx}
                            variant="circular"
                            animation="wave"
                            width={32}
                            height={32}
                        />
                    ))}
                </Box>
            ) }
        </div>
    );
}

export default SidedrawFooter;
