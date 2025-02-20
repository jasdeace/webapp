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
      } catch (err) {
        setMessage('Error fetching user: ' + err.message);
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
      // Fetch user's credit balance, fail if no row exists
      const { data: creditData, error: creditError } = await supabase
        .from('credits')
        .select('credit_balance')
        .eq('user_id', userId)
        .single();

      console.log('Credit Data (Before Update):', creditData, 'Credit Error:', creditError); // Debug log

      if (!creditData) {
        setMessage('No credit record found. Please contact support or sign up again.');
        return;
      }

      if (creditError) {
        if (creditError.code === 'PGRST116') { // No rows found
          setMessage('No credit record found. Please contact support or sign up again.');
          return;
        }
        throw creditError;
      }

      const currentCredit = creditData.credit_balance;
      if (currentCredit === null || currentCredit === undefined) {
        setMessage('Invalid credit balance. Please contact support.');
        return;
      }

      const newCredit = currentCredit + parseInt(amount);

      // Update credit balance and ensure we get the updated row
      const { data: updatedCredit, error: updateError } = await supabase
        .from('credits')
        .update({ credit_balance: newCredit })
        .eq('user_id', userId)
        .single()
        .then(response => ({
          data: response.data,
          error: response.error,
        }));

      console.log('Updated Credit Data:', updatedCredit, 'Update Error:', updateError); // Debug log

      if (updateError) {
        if (updateError.status === 406) {
          throw new Error('Supabase rejected the update. Check RLS policies or API headers.');
        }
        throw updateError;
      }

      // Handle case where updatedCredit might be null, fallback to newCredit
      const finalCredit = updatedCredit?.credit_balance || newCredit;
      setMessage(`Top-up successful! Your new balance is: ${finalCredit} credits`);
      setAmount(''); // Reset input
    } catch (err) {
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