type ReadCssCustomPropertiesOptions = {
  scopeClassName?: string;
  fallbackValues?: Record<string, string>;
};

/**
 * Reads CSS custom properties from a temporary scoped element.
 * Useful when styles are defined in class scopes instead of :root.
 */
export const readCssCustomProperties = (
  propertyNames: string[],
  options: ReadCssCustomPropertiesOptions = {},
) => {
  const { scopeClassName, fallbackValues = {} } = options;
  const result: Record<string, string> = {};

  for (const propertyName of propertyNames) {
    result[propertyName] = fallbackValues[propertyName] ?? '';
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return result;
  }

  const probe = document.createElement('div');
  if (scopeClassName) {
    probe.className = scopeClassName;
  }
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';

  document.body.appendChild(probe);
  try {
    const styles = window.getComputedStyle(probe);
    for (const propertyName of propertyNames) {
      const value = styles.getPropertyValue(propertyName).trim();
      if (value) {
        result[propertyName] = value;
      }
    }
    return result;
  } finally {
    document.body.removeChild(probe);
  }
};
