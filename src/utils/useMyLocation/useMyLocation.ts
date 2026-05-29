import { useEffect, useState } from 'react';

export type MyLocation = {
  lat: number;
  lon: number;
  district: string;
  city: string;
  region: string;
  country: string;
  zip: string;
};

const useMyLocation = () => {
  const [location, setLocation] = useState<MyLocation | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/my-location`)
      .then((r) => { 
        if (!r.ok) { throw new Error(`${r.status}`); } return r.json(); }
      ).then((data: MyLocation) => { 
        if (!cancelled) { setLocation(data); } 
      }).catch(() => { /* silent — location is best-effort */ });
    return () => { cancelled = true; };
  }, []);

  return location;
};

export default useMyLocation;
