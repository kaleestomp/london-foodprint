const BREAKPOINTS: [number, number][] = [
  [2400, 20],
  [2000, 18],
  [1600, 16],
  [1200, 14],
  [800, 12],
  [600, 10],
];

const DEFAULT_FETCH_LIMIT = 10;

const getFetchLimit = (): number => {
  if (typeof window === 'undefined') return DEFAULT_FETCH_LIMIT;

  const width = window.innerWidth;
  const match = BREAKPOINTS.find(([minWidth]) => width >= minWidth);

  return match ? match[1] : DEFAULT_FETCH_LIMIT;
};

export default getFetchLimit;