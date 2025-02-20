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
      // Fetch or create user's credit balance
      let { data: creditData, error: creditError } = await supabase
        .from('credits')
        .select('credit_balance')
        .eq('user_id', userId)
        .single();

      if (creditError && creditError.code === 'PGRST116') { // No rows found
        // Insert a new credits row with 0 balance if none exists
        const { error: insertError } = await supabase
          .from('credits')
          .insert({ user_id: userId, credit_balance: 0 });
        if (insertError) throw insertError;

        // Fetch the newly inserted row
        ({ data: creditData } = await supabase
          .from('credits')
          .select('credit_balance')
          .eq('user_id', userId)
          .single());
      } else if (creditError) {
        throw creditError;
      }

      const currentCredit = creditData.credit_balance || 0;
      const newCredit = currentCredit + parseInt(amount);

      // Update credit balance
      const { data: updatedCredit, error: updateError } = await supabase
        .from('credits')
        .update({ credit_balance: newCredit })
        .eq('user_id', userId)
        .single();

      if (updateError) throw updateError;

      setMessage(`Top-up successful! Your new balance is: ${updatedCredit.credit_balance} credits`);
      setAmount(''); // Reset input
    } catch (err) {
      setMessage('An error occurred during top-up: ' + err.message);
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