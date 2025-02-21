import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient'; // Adjust path if needed
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthenticatedLayout from '../components/AuthenticatedLayout'; // Adjust path if needed

export default function SubmitForm() {
  const [formData, setFormData] = useState('');
  const [userId, setUserId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [credit, setCredit] = useState(null); // Initialize as null to track absence
  const router = useRouter();

  useEffect(() => {
    async function checkUserAndCredit() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('Auth User Data:', user, 'Auth User Error:', userError); // Debug auth

        if (userError || !user) {
          router.push('/login');
          return;
        }
        setUserId(user.id);

        // Fetch user's credit balance, fail if no row exists
        const { data: creditData, error: creditError } = await supabase
          .from('credits')
          .select('credit_balance')
          .eq('user_id', user.id)
          .single();

        console.log('Credit Data (Initial):', creditData, 'Credit Error:', creditError); // Debug credits

        if (!creditData) {
          setCredit(null); // No credits row exists
          setError('No credit record found. Please contact support or sign up again.');
          return;
        }

        if (creditError) {
          if (creditError.code === 'PGRST116') { // No rows found
            setCredit(null);
            setError('No credit record found. Please contact support or sign up again.');
          } else {
            throw creditError;
          }
        } else {
          setCredit(creditData.credit_balance);
          if (creditData.credit_balance === null || creditData.credit_balance === undefined) {
            setError('Invalid credit balance. Please contact support.');
            setCredit(null);
          }
        }
      } catch (err) {
        setError('Error checking authentication or credit: ' + err.message);
      }
    }
    checkUserAndCredit();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError('You must be logged in to submit the form.');
      return;
    }
    if (credit === null || credit <= 0) {
      setError('Insufficient credits. Please top up before submitting.');
      return;
    }
    setError(null);
    try {
      // Deduct 1 credit before submission
      const { data: updatedCredit, error: updateError } = await supabase
        .from('credits')
        .update({ credit_balance: credit - 1 })
        .eq('user_id', userId)
        .single()
        .then(response => ({
          data: response.data,
          error: response.error,
        }));

      console.log('Updated Credit Data:', updatedCredit, 'Update Error:', updateError); // Debug update

      if (updateError) {
        if (updateError.status === 406) {
          throw new Error('Supabase rejected the update. Check RLS policies or API headers.');
        }
        throw updateError;
      }

      // Handle case where updatedCredit might be null, fallback to credit - 1
      const finalCredit = updatedCredit?.credit_balance || (credit - 1);
      if (finalCredit === null || finalCredit === undefined) {
        setError('Failed to update credit balance. Please contact support.');
        return;
      }
      setCredit(finalCredit);

      // Verify credit record after update to ensure it exists
      const { data: postUpdateCredit, error: postUpdateError } = await supabase
        .from('credits')
        .select('credit_balance')
        .eq('user_id', userId)
        .single();

      console.log('Post-Update Credit Data:', postUpdateCredit, 'Post-Update Error:', postUpdateError);

      if (postUpdateError || !postUpdateCredit) {
        setError('Credit record not found after update. Please contact support.');
        // Roll back credit
        await supabase
          .from('credits')
          .update({ credit_balance: credit })
          .eq('user_id', userId);
        setCredit(credit);
        return;
      }

      // Ensure post-update credit matches expected value
      if (postUpdateCredit.credit_balance !== finalCredit) {
        setError('Credit balance mismatch after update. Please contact support.');
        // Roll back credit
        await supabase
          .from('credits')
          .update({ credit_balance: credit })
          .eq('user_id', userId);
        setCredit(credit);
        return;
      }

      // Debug payload before API call, including auth token
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Submitting Form Data:', { userId, formData, credit_balance: finalCredit, sessionToken: session?.access_token });

      // Submit the form, including auth token in headers
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`, // Add auth token
        },
        body: JSON.stringify({ userId, formData, credit_balance: finalCredit }),
      });
      const data = await response.json();
      console.log('API Response:', data); // Debug API response
      if (!response.ok) {
        // Roll back credit if submission fails
        await supabase
          .from('credits')
          .update({ credit_balance: credit })
          .eq('user_id', userId);
        setCredit(credit); // Restore local state
        setError(data.error || 'Form submission failed.');
      } else {
        setResult(data.result);
      }
    } catch (err) {
      setError('An error occurred: ' + err.message);
      // Roll back credit on error
      await supabase
        .from('credits')
        .update({ credit_balance: credit })
        .eq('user_id', userId);
      setCredit(credit); // Restore local state
    }
  };

  if (!userId) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-md mx-auto text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Submit Form</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {error === 'Insufficient credits. Please top up before submitting.' && (
          <p className="mb-4">
            <Link href="/topup" className="text-blue-600 underline hover:text-blue-800">
              Click here to top up your credits
            </Link>
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={formData}
            onChange={(e) => setFormData(e.target.value)}
            placeholder="Enter your form data here..."
            rows="6"
            className="w-full p-2 border rounded"
          />
          <br />
          <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Submit Form
          </button>
        </form>
        {result && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-2">Processing Result:</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}