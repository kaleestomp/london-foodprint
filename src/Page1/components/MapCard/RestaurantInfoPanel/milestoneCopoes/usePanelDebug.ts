import { useCallback, useEffect, useState } from 'react';

const MAX_DEBUG_EVENTS = 12;
const DEBUG_PARAM = 'panelDebug';

const hasTruthyDebugValue = (value: string | null) => {
  if (value == null) return false;
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) return true;
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

const hasDebugFromSearch = (searchRaw: string) => {
  const readParams = (raw: string) => {
    const normalized = raw.startsWith('?') ? raw.slice(1) : raw;
    return new URLSearchParams(normalized);
  };

  const params = readParams(searchRaw);
  if (params.has(DEBUG_PARAM) && hasTruthyDebugValue(params.get(DEBUG_PARAM))) {
    return true;
  }

  // Safari/share flows can percent-encode delimiters into one token, for
  // example: ?panelDebug%3D1%26v%3D20260614. Decode once and retry parsing.
  try {
    const decoded = decodeURIComponent(searchRaw);
    const decodedParams = readParams(decoded);
    if (decodedParams.has(DEBUG_PARAM) && hasTruthyDebugValue(decodedParams.get(DEBUG_PARAM))) {
      return true;
    }
  } catch {
    // Ignore malformed URI sequences.
  }

  return false;
};

const persistPanelDebugFlag = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEBUG_PARAM, '1');
  } catch {
    // Ignore localStorage access errors (private mode/restricted contexts).
  }
};

const isPanelDebugEnabled = () => {
  if (typeof window === 'undefined') return false;

  if (hasDebugFromSearch(window.location.search)) {
    persistPanelDebugFlag();
    return true;
  }

  const hashRaw = window.location.hash ?? '';
  const hash = hashRaw.startsWith('#') ? hashRaw.slice(1) : hashRaw;
  const hashParams = new URLSearchParams(hash);
  if (hashParams.has(DEBUG_PARAM) && hasTruthyDebugValue(hashParams.get(DEBUG_PARAM))) {
    persistPanelDebugFlag();
    return true;
  }

  const hashSegments = hash.split(/[?&]/).map((segment) => segment.trim().toLowerCase());
  if (hashSegments.includes(DEBUG_PARAM.toLowerCase())) {
    persistPanelDebugFlag();
    return true;
  }

  try {
    const stored = window.localStorage.getItem(DEBUG_PARAM);
    if (hasTruthyDebugValue(stored)) {
      return true;
    }
  } catch {
    // Ignore localStorage access errors (private mode/restricted contexts).
  }

  return false;
};

const usePanelDebug = () => {
  const [enabled, setEnabled] = useState(() => isPanelDebugEnabled());
  const [events, setEvents] = useState<string[]>([]);

  const pushEvent = useCallback((message: string) => {
    if (!enabled) return;
    const ts = new Date().toISOString().split('T')[1]?.replace('Z', '') ?? '';
    setEvents((prev) => {
      const next = [`${ts} ${message}`, ...prev];
      return next.slice(0, MAX_DEBUG_EVENTS);
    });
  }, [enabled]);

  useEffect(() => {
    const updateEnabled = () => {
      setEnabled(isPanelDebugEnabled());
    };

    updateEnabled();
    window.addEventListener('hashchange', updateEnabled);
    window.addEventListener('popstate', updateEnabled);

    return () => {
      window.removeEventListener('hashchange', updateEnabled);
      window.removeEventListener('popstate', updateEnabled);
    };
  }, []);

  return {
    enabled,
    events,
    pushEvent,
  };
};

export default usePanelDebug;