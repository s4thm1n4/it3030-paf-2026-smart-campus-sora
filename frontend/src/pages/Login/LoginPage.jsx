import { useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/apiError';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /** After Google sign-in, send users to Tickets by default (or back to the page they tried to open). */
  const fromPath = location.state?.from?.pathname;
  const destination =
    fromPath && fromPath !== '/login' ? fromPath : '/tickets';

  // Already signed in — leave the login screen (stops the "sign in again" loop feeling).
  useEffect(() => {
    if (!loading && user) {
      navigate(destination, { replace: true });
    }
  }, [loading, user, navigate, destination]);

  const handleSuccess = async (credentialResponse) => {
    try {
      const userData = await login(credentialResponse.credential);
      toast.success(`Welcome, ${userData.name}!`);
      navigate(destination, { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Login failed. Please try again.');
    }
  };

  const handleError = () => {
    toast.error('Google sign-in was cancelled or failed.');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <div className="mb-6">
          <span className="text-5xl">🏫</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Smart Campus</h2>
        <p className="text-gray-500 mb-6">Sign in to access the Operations Hub</p>

        {!GOOGLE_CLIENT_ID && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
            <p className="font-semibold">Missing VITE_GOOGLE_CLIENT_ID</p>
            <p className="mt-1 text-amber-800">
              Create <code className="rounded bg-amber-100 px-1">frontend/.env</code> from{' '}
              <code className="rounded bg-amber-100 px-1">.env.example</code>, set your Web client ID,
              then restart <code className="rounded bg-amber-100 px-1">npm run dev</code>.
            </p>
          </div>
        )}

        <div className="flex justify-center">
          {GOOGLE_CLIENT_ID ? (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap={false}
              shape="rectangular"
              size="large"
              text="signin_with"
              theme="outline"
            />
          ) : (
            <p className="text-sm text-gray-500">Configure Google client ID to enable sign-in.</p>
          )}
        </div>

        <details className="mt-8 text-left text-sm text-gray-600 border-t border-gray-100 pt-6">
          <summary className="cursor-pointer font-medium text-gray-800 hover:text-blue-700">
            “Access blocked” or Google authorization error?
          </summary>
          <ol className="mt-3 list-decimal list-inside space-y-2 text-xs leading-relaxed text-gray-600">
            <li>
              Open{' '}
              <span className="font-medium text-gray-800">Google Cloud Console</span> → APIs &amp;
              Services → Credentials → your OAuth 2.0 Client ID (type Web application).
            </li>
            <li>
              Under <span className="font-medium text-gray-800">Authorized JavaScript origins</span>,
              add the exact URL you use in the address bar, including port, e.g.{' '}
              <code className="rounded bg-gray-100 px-1">http://localhost:5173</code> and{' '}
              <code className="rounded bg-gray-100 px-1">http://127.0.0.1:5173</code> (both if you
              switch between them).
            </li>
            <li>
              OAuth consent screen → if the app is in <span className="font-medium">Testing</span>,
              add your Google account under <span className="font-medium">Test users</span>.
            </li>
            <li>
              Backend <code className="rounded bg-gray-100 px-1">client-id</code> must match this same
              Web client ID (no typo, no extra spaces).
            </li>
          </ol>
        </details>

        <p className="mt-6 text-xs text-gray-400">
          Secured with OAuth 2.0 — IT3030 PAF 2026 · Group SORA
        </p>
      </div>
    </div>
  );
}
