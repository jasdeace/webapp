// components/AuthenticatedLayout.js
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient'; // Adjust path if needed (e.g., '../../utils/supabaseClient')
import Link from 'next/link';

export default function AuthenticatedLayout({ children }) {
  const [user, setUser] = useState(null);
  const [credit, setCredit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAndCredit() {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        setUser(user);

        if (user) {
          // Fetch user's credit balance from the credits table
          const { data: creditData, error: creditError } = await supabase
            .from('credits')
            .select('credit_balance')
            .eq('user_id', user.id)
            .single();

          if (creditError) throw creditError;

          setCredit(creditData.credit_balance || 0);
        }
      } catch (err) {
        console.error('Error fetching user or credit:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndCredit();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserAndCredit(); // Refresh credit when auth state changes
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">My Web App</h1>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span>Credits: {credit}</span>
              <Link href="/topup" className="text-white underline hover:text-blue-200">
                Top Up
              </Link>
              <span>Welcome, {user.email} (Logged In)</span>
            </>
          ) : (
            <Link href="/login" className="text-white underline hover:text-blue-200">
              Login
            </Link>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}