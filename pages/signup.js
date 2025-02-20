import { useState } from 'react';
import { supabase } from '../utils/supabaseClient'; // Adjust path if needed
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthenticatedLayout from '../components/AuthenticatedLayout'; // Adjust path if needed

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      setError(null);

      // Insert default credit balance for the new user
      const { error: creditError } = await supabase
        .from('credits')
        .insert({ user_id: (await supabase.auth.getUser()).data.user.id, credit_balance: 0 });

      if (creditError) throw creditError;

      setMessage(
        'Sign up successful! Please check your email for a verification link. The link will redirect you to ' +
        'https://your-project-name.vercel.app.'
      );
      router.push('/login');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-md mx-auto text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {message && <p className="text-green-600 mb-4">{message}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
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
            Sign Up
          </button>
        </form>
        <p className="mt-4">
          Already have an account?{' '}
          <Link href="/login">
            <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">Login here</span>
          </Link>
        </p>
      </div>
    </AuthenticatedLayout>
  );
}