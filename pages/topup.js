import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient'; // Adjust path if needed
import { useRouter } from 'next/router';
import AuthenticatedLayout from '../components/AuthenticatedLayout'; // Adjust path if needed

export default function TopUp() {
  const [userId, setUserId] = useState(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/login');
          return;
        }
        setUserId(user.id);

        // First try to create a credit record if it doesn't exist
        const { error: insertError } = await supabase
          .from('credits')
          .insert([{ user_id: user.id, credit_balance: 0 }])
          .select()
          .maybeSingle();

        // If error is not duplicate key violation, it's unexpected
        if (insertError && !insertError.message?.includes('duplicate key')) {
          console.error('Error initializing credits:', insertError);
          setMessage('Error initializing credits: ' + insertError.message);
        }

        // Fetch current credit balance
        const { data: creditData, error: fetchError } = await supabase
          .from('credits')
          .select('credit_balance')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        console.log('Current credit balance:', creditData?.credit_balance);
      } catch (err) {
        console.error('Error in checkUser:', err);
        setMessage('Error checking user credits: ' + err.message);
      }
    }
    checkUser();
  }, [router]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    if (!userId) {
      setMessage('You must be logged in to top up.');
      return;
    }
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      setMessage('Please enter a valid positive number of credits.');
      return;
    }
    try {
      // First get current balance
      const { data: currentData, error: fetchError } = await supabase
        .from('credits')
        .select('credit_balance')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!currentData) {
        throw new Error('No credit record found');
      }

      const newBalance = (currentData.credit_balance || 0) + parseInt(amount);

      // Update the balance
      const { data: updated, error: updateError } = await supabase
        .from('credits')
        .update({ credit_balance: newBalance })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setMessage(`Top-up successful! Your new balance is: ${updated.credit_balance} credits`);
      setAmount('');
    } catch (err) {
      console.error('Top-up error:', err);
      setMessage(`An error occurred during top-up: ${err.message}`);
    }
  };

  if (!userId) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-md mx-auto text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Top Up</h1>
        {message && <p className="mb-4">{message}</p>}
        <form onSubmit={handleTopUp} className="space-y-4">
          <input
            type="number"
            placeholder="Enter credits to add"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Add Credits
          </button>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}