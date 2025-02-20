import { useState } from 'react';
import { supabase } from '../utils/supabaseClient'; // Adjust path if needed
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthenticatedLayout from '../components/AuthenticatedLayout'; // Adjust path if needed

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      setError(null);
      alert('Logged in successfully!');
      router.push('/submit-form');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-md mx-auto text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Login
          </button>
        </form>
        <br />
        <button
          onClick={handleGoogleLogin}
          className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Login with Google
        </button>
        <p className="mt-4">
          Don’t have an account?{' '}
          <Link href="/signup">
            <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">Sign up here</span>
          </Link>
        </p>
      </div>
    </AuthenticatedLayout>
  );
}