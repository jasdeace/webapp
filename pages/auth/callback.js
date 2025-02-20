// pages/auth/callback.js
import { useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error verifying session:', error);
        router.push('/login');
        return;
      }
      if (data?.session) {
        router.push('/submit-form'); // Redirect to submit form after verification
      } else {
        router.push('/login');
      }
    }
    handleCallback();
  }, [router]);

  return <div>Verifying your email... Please wait...</div>;
}