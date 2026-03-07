import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // TODO: Replace with actual Google OAuth button
  const handleDemoLogin = async () => {
    // Placeholder — will be replaced with GoogleLogin component
    console.log('Google OAuth login will go here');
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
        <p className="text-gray-500 mb-8">Sign in to Smart Campus</p>

        {/* TODO: M4 — Replace with @react-oauth/google GoogleLogin */}
        <button
          onClick={handleDemoLogin}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Sign in with Google
        </button>

        <p className="mt-4 text-xs text-gray-400">
          OAuth 2.0 authentication powered by Google
        </p>
      </div>
    </div>
  );
}
