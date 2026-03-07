import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <div className="mb-6">
          <span className="text-5xl">🏫</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Smart Campus</h2>
        <p className="text-gray-500 mb-8">Sign in to access the Operations Hub</p>

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

        <p className="mt-6 text-xs text-gray-400">
          Secured with OAuth 2.0 — IT3030 PAF 2026 · Group SORA
        </p>
      </div>
    </div>
  );
}




