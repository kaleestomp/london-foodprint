import { useAuth } from './AuthContext';

export const AuthGate = () => {
  const {
    isAuthenticated,
    isLoading,
    userName,
    userEmail,
    roles,
    canAccessApp,
    login,
    logout,
  } = useAuth();

  if (isLoading) {
    return (
      <section className="auth-screen" aria-live="polite">
        <div className="auth-card">
          <h1>Loading Microsoft Sign-In...</h1>
          <p>Checking your account and role assignment.</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="auth-screen" aria-live="polite">
        <div className="auth-card">
          <h1>Sign In Required</h1>
          <p>Please sign in with your company Microsoft account to continue.</p>
          <button type="button" className="auth-btn" onClick={() => void login()}>
            Sign in with Microsoft
          </button>
        </div>
      </section>
    );
  }

  if (!canAccessApp) {
    return (
      <section className="auth-screen" aria-live="polite">
        <div className="auth-card">
          <h1>Access Not Assigned</h1>
          <p>
            Your account is signed in but does not have an allowed role for this app.
          </p>
          <p className="auth-meta">Signed in as: {userName ?? userEmail ?? 'Unknown user'}</p>
          <p className="auth-meta">Current roles: {roles.length ? roles.join(', ') : 'None'}</p>
          <button type="button" className="auth-btn auth-btn-secondary" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </section>
    );
  }

  return null;
};
