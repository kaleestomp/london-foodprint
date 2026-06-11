import React from 'react';

import Loading from '../components/Loading/Loading';
import MapCard from './components/MapCard/MapCard'; 
// import SideCard from './components/SideCard/SideCard'; 

import { useAppUI } from '../context/AppUIContext'; 

import './Page1.css';

const Page1: React.FC = () => {

// Initialise Page 1 ---- 
//   const { isLoading } = useSelectKPIRef();
//   const firstLoad = useRef<boolean>(true);
//   if (!isLoading && firstLoad.current) {
//     firstLoad.current = false;
//   }
const { isLoading } = useAppUI()!; 

  return (
    <div className="page1-container">
        <Loading loading={isLoading} />
        <MapCard />
    </div>
  );
};

export default Page1;
