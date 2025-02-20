// pages/auth/callback.js
import { useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient'; // Correct path
import { useRouter } from 'next/router';

console.log('Attempting to import supabase from:', '../../utils/supabaseClient');

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        console.log('Checking session after callback...');
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error verifying session:', error.message);
          router.push('/login');
          return;
        }
        if (data?.session) {
          console.log('Valid session found, redirecting to /submit-form');
          router.push('/submit-form'); // Redirect to submit form after successful verification
        } else {
          console.log('No valid session, redirecting to /login');
          router.push('/login');
        }
      } catch (err) {
        console.error('Unexpected error in callback:', err.message);
        router.push('/login');
      }
    }
    handleCallback();
  }, [router]);

  return <div>Verifying your email or authentication... Please wait...</div>;
}