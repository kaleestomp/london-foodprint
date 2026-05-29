
import { useEffect } from 'react';
import { useAppUI } from '../../context/AppUIContext'; 

const showLoading = (loading: boolean) => {
    const { toggleLoading } = useAppUI()!; 
    useEffect(() => { 
        toggleLoading(loading); 
    }, [loading]); 
}; 

export default showLoading;