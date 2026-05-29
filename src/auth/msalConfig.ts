import { LogLevel, type Configuration, type PopupRequest } from '@azure/msal-browser';

const env = import.meta.env as Record<string, string | undefined>;

const tenantId = env.VITE_AZURE_TENANT_ID;
const clientId = env.VITE_AZURE_CLIENT_ID;

if (!tenantId || !clientId) {
  console.warn(
    'Missing VITE_AZURE_TENANT_ID or VITE_AZURE_CLIENT_ID in environment. Microsoft login will fail until these are configured.',
  );
}

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId ?? '',
    authority: `https://login.microsoftonline.com/${tenantId ?? ''}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
        if (level === LogLevel.Warning) console.warn(message);
      },
      logLevel: LogLevel.Warning,
    },
  },
};

const optionalScopes = (env.VITE_AZURE_LOGIN_SCOPES ?? '')
  .split(',')
  .map((scope) => scope.trim())
  .filter(Boolean);

export const loginRequest: PopupRequest = {
  scopes: ['openid', 'profile', 'email', ...optionalScopes],
};
