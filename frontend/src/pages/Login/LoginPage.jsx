import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Icon from '../../components/common/Icon';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSuccess = async (credentialResponse) => {
    setLoginError('');
    setLoggingIn(true);
    try {
      console.log('[Login] Google credential received');
      const userData = await login(credentialResponse.credential);
      console.log('[Login] Success:', userData);
      toast.success(`Welcome, ${userData.name}!`);
      // Use replace to prevent back-button returning to login
      navigate('/', { replace: true });
      // Fallback: if React navigate doesn't trigger (race condition), force it
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          window.location.href = '/';
        }
      }, 500);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg = data?.message || data?.error || JSON.stringify(data) || err?.message || 'Unknown error';
      console.error('[Login] Failed - status:', status, 'data:', data);
      setLoginError(`Error ${status ?? 'network'}: ${msg}`);
      toast.error(String(msg));
      setLoggingIn(false);
    }
  };

  const handleError = () => {
    setLoginError('Google sign-in was cancelled or failed.');
    toast.error('Google sign-in was cancelled or failed.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }


  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Brand / Info ── */}
      <div className="hidden lg:flex lg:w-[420px] bg-sidebar flex-col justify-between p-10 select-none">
        {/* Top brand block */}
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <Icon name="hub" className="text-on-primary text-xl" />
            </div>
            <span className="font-display text-on-sidebar text-lg tracking-tight font-semibold">
              SORA UMS
            </span>
          </div>

          <p className="label-caps text-outline text-[11px] mb-4">System Identity</p>

          <div className="space-y-3">
            <div className="cell-border px-4 py-3">
              <p className="label-caps text-outline text-[10px] mb-1">Designation</p>
              <p className="font-mono text-on-sidebar text-sm">SORA_UMS_V1</p>
            </div>
            <div className="cell-border px-4 py-3">
              <p className="label-caps text-outline text-[10px] mb-1">Platform</p>
              <p className="font-mono text-on-sidebar text-sm">University Management System</p>
            </div>
            <div className="cell-border px-4 py-3">
              <p className="label-caps text-outline text-[10px] mb-1">Protocol</p>
              <p className="font-mono text-on-sidebar text-sm">OAuth 2.0 / OpenID</p>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-2 text-outline">
            <Icon name="lock" className="text-base" />
            <span className="font-mono text-[11px]">TLS 1.3 ENCRYPTED</span>
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-outline text-[11px]">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* ── Right Panel: Login ── */}
      <div className="flex-1 bg-surface flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="passkey" className="text-primary text-2xl" />
              <h1 className="font-display text-on-surface text-2xl font-semibold tracking-tight">
                Sign In
              </h1>
            </div>
            <p className="text-outline text-sm mt-1">
              Authenticate via Google to access SORA UMS.
            </p>
          </div>

          {/* Auth card */}
          <div className="cell-border bg-surface-container p-6">
            <p className="label-caps text-outline text-[10px] mb-5">Authentication</p>

            {/* Visible error message */}
            {loginError && (
              <div className="mb-4 p-3 border border-red-400 bg-red-50 text-red-700 text-xs font-mono rounded break-all">
                ⚠ {loginError}
              </div>
            )}

            {loggingIn ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                <span className="text-xs text-outline font-mono">Signing in...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={handleError}
                  useOneTap={false}
                  shape="rectangular"
                  size="large"
                  text="signin_with"
                  theme="outline"
                />
              </div>
            )}

            <div className="mt-5 flex items-center gap-2 justify-center text-outline">
              <Icon name="shield" className="text-sm" />
              <span className="font-mono text-[10px]">GOOGLE IDENTITY PROVIDER</span>
            </div>
          </div>

          {/* Info row */}
          <div className="mt-6 flex items-start gap-3 text-outline">
            <Icon name="info" className="text-base mt-0.5 shrink-0" />
            <p className="font-mono text-[11px] leading-relaxed">
              Only authorized university accounts are permitted. Credentials are never stored on this server.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 font-mono text-[11px] text-outline">
          Secured with OAuth 2.0 — IT3030 PAF 2026 · Group SORA
        </p>
      </div>
    </div>
  );
}
