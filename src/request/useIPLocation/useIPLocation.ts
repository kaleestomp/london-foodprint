import { apiBasePromise } from '../../utils/apiBase';
import { useEffect, useState } from 'react';

// const LOCAL_URL = 'http://localhost:3000';

export type MyLocation = {
  lat: number;
  lon: number;
  district: string;
  city: string;
  region: string;
  country: string;
  zip: string;
};

const useIPLocation = () => {
  const [location, setLocation] = useState<MyLocation | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchLocation = async () => {
      const API_BASE = await apiBasePromise;
      // if (API_BASE !== LOCAL_URL) {
      //   return;
      // }
      fetch(`${API_BASE}/api/ip-location`)
        .then((r) => { 
          /* silent — location is best-effort */
          // if (!r.ok) { throw new Error(`${r.status}`); } 
          return r.json(); 
        }).then((data: MyLocation) => { 
          if (!cancelled) { setLocation(data); } 
        }).catch(() => { /* silent — location is best-effort */ });
    };
    
    fetchLocation();
    return () => { cancelled = true; };
  }, []);

  return location;
};

export default useIPLocation;
