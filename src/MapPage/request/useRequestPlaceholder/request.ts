// Temporary local env-backed API base URL with localhost fallback.
const API_BASE =
  (import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL ??
  'http://localhost:3000';

export interface dataContract {
  product: string;
  productName: string;
  country: string;
  kgCOO2eq: number;
  latitude: number;
  longitude: number;
}

const contractMet = (value: unknown): value is dataContract => {
  if (typeof value !== 'object' || value === null) { return false; }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.product === 'string' &&
    typeof candidate.productName === 'string' &&
    typeof candidate.country === 'string' &&
    typeof candidate.kgCOO2eq === 'number' &&
    typeof candidate.latitude === 'number' &&
    typeof candidate.longitude === 'number'
  );
};

export const request = async ( 
    path: string, 
    { signal }: { signal?: AbortSignal } = {} 
): Promise<dataContract[]> => {
  const params = new URLSearchParams({ path: path });
  const res: Response = await fetch(`${API_BASE}/api/read-db?${params}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  if (!Array.isArray(payload) || !payload.every(contractMet)) { throw new Error('Invalid response shape.'); }
  const data: dataContract[] = payload; 
  return data;
}; 

