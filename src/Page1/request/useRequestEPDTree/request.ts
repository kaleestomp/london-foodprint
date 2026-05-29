// Temporary local env-backed API base URL with localhost fallback.
const API_BASE =
  (import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL ??
  'http://localhost:3000';

export interface apiResourceContract { 
  name: string | null;
  children: object[] | null;
  value: number | null;
}

const contractMet = (value: unknown): value is apiResourceContract => {
  if (typeof value !== 'object' || value === null) { return false; }
  const candidate = value as Record<string, unknown>; 
  // console.log('Contract Check Candidate:', candidate); // Debug log
  return (
    (typeof candidate.name === 'string' || candidate.name === null) &&
    (Array.isArray(candidate.children) || candidate.children === null) &&
    (typeof candidate.value === 'number' || candidate.value === null || candidate.value === undefined) // Allow value to be optional
  );
};

export const request = async ( 
    path: string, 
    { signal }: { signal?: AbortSignal } = {} 
): Promise<apiResourceContract[]> => {
  const params = new URLSearchParams({ path: path });
  const res: Response = await fetch(`${API_BASE}/api/read-tree?${params}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  if (!Array.isArray(payload) || !payload.every(contractMet)) { throw new Error('Invalid response shape.'); }
  const data: apiResourceContract[] = payload;
  return data;
};
