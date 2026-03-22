import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Icon from '../../components/common/Icon';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    try {
      const userData = await login(credentialResponse.credential);
      toast.success(`Welcome, ${userData.name}!`);
      navigate('/');
    } catch (err) {
      toast.error('Login failed. Please try again.');
    }
  };

  const handleError = () => {
    toast.error('Google sign-in was cancelled or failed.');
  };

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
              CAMPUS_CORE
            </span>
          </div>

          <p className="label-caps text-outline text-[11px] mb-4">System Identity</p>

          <div className="space-y-3">
            <div className="cell-border px-4 py-3">
              <p className="label-caps text-outline text-[10px] mb-1">Designation</p>
              <p className="font-mono text-on-sidebar text-sm">CAMPUS_CORE_V1</p>
            </div>
            <div className="cell-border px-4 py-3">
              <p className="label-caps text-outline text-[10px] mb-1">Node</p>
              <p className="font-mono text-on-sidebar text-sm">NODE_01</p>
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
              Authenticate via Google to access the Operations Hub.
            </p>
          </div>

          {/* Auth card */}
          <div className="cell-border bg-surface-container p-6">
            <p className="label-caps text-outline text-[10px] mb-5">Authentication</p>

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
