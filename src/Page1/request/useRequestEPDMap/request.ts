// Temporary local env-backed API base URL with localhost fallback.
const API_BASE =
  (import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL ??
  'http://localhost:3000';

export interface apiResourceContract { 
  Region: string | null;
  Country: string | null;
  Material: string | null;
  ProductName: string | null;
  KgCO2eq: number | null;
  Latitude: number | null;
  Longitude: number | null;
}

const contractMet = (value: unknown): value is apiResourceContract => {
  if (typeof value !== 'object' || value === null) { return false; }
  const candidate = value as Record<string, unknown>; 
  return (
    (typeof candidate.Region === 'string' || candidate.Region === null) &&
    (typeof candidate.Country === 'string' || candidate.Country === null) &&
    (typeof candidate.Material === 'string' || candidate.Material === null) &&
    (typeof candidate.ProductName === 'string' || candidate.ProductName === null) &&
    (typeof candidate.KgCO2eq === 'number' || candidate.KgCO2eq === null) &&
    (typeof candidate.Latitude === 'number' || candidate.Latitude === null) &&
    (typeof candidate.Longitude === 'number' || candidate.Longitude === null)
  );
};

export const request = async ( 
    path: string, 
    { signal }: { signal?: AbortSignal } = {} 
): Promise<apiResourceContract[]> => {
  const params = new URLSearchParams({ path: path });
  const res: Response = await fetch(`${API_BASE}/api/read-db?${params}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  if (!Array.isArray(payload) || !payload.every(contractMet)) { throw new Error('Invalid response shape.'); }
  const data: apiResourceContract[] = payload; 
  return data;
}; 

