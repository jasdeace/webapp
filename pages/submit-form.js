import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AuthenticatedLayout from '../components/AuthenticatedLayout';

export default function SubmitForm() {
  const [formData, setFormData] = useState('');
  const [userId, setUserId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [credit, setCredit] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function checkUserAndCredit() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('[useEffect] Auth User Response:', { user, userError }); // Debug 1: Auth fetch
        if (userError || !user) {
          router.push('/login');
          return;
        }
        setUserId(user.id);

        const { data: creditData, error: creditError } = await supabase
          .from('credits')
          .select('credit_balance')
          .eq('user_id', user.id)
          .single();
        console.log('[useEffect] Credit Fetch Response:', { creditData, creditError }); // Debug 2: Initial credit fetch

        if (!creditData) {
          setCredit(null);
          setError('No credit record found. Please contact support or sign up again.');
          return;
        }
        if (creditError) {
          if (creditError.code === 'PGRST116') {
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
        console.error('[useEffect] Error:', err); // Debug 3: Catch block
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
      // Deduct 1 credit
      const { data: updatedCredit, error: updateError } = await supabase
        .from('credits')
        .update({ credit_balance: credit - 1 })
        .eq('user_id', userId)
        .select() // Ensure data is returned
        .single();
      console.log('[handleSubmit] Credit Update Response:', { updatedCredit, updateError }); // Debug 4: Credit update

      if (updateError) {
        throw new Error('Credit update failed: ' + updateError.message);
      }
      if (!updatedCredit) {
        throw new Error('No credit data returned after update');
      }
      const finalCredit = updatedCredit.credit_balance;
      setCredit(finalCredit);

      // Verify credit after update
      const { data: postUpdateCredit, error: postUpdateError } = await supabase
        .from('credits')
        .select('credit_balance')
        .eq('user_id', userId)
        .single();
      console.log('[handleSubmit] Post-Update Credit Verify:', { postUpdateCredit, postUpdateError }); // Debug 5: Post-update check

      if (postUpdateError || !postUpdateCredit) {
        setError('Credit record not found after update. Rolling back.');
        await supabase
          .from('credits')
          .update({ credit_balance: credit })
          .eq('user_id', userId);
        setCredit(credit);
        return;
      }
      if (postUpdateCredit.credit_balance !== finalCredit) {
        setError('Credit balance mismatch after update. Rolling back.');
        await supabase
          .from('credits')
          .update({ credit_balance: credit })
          .eq('user_id', userId);
        setCredit(credit);
        return;
      }

      // API call
      const { data: { session } } = await supabase.auth.getSession();
      const requestPayload = { userId, formData, credit_balance: finalCredit };
      console.log('[handleSubmit] API Request Payload:', { ...requestPayload, sessionToken: session?.access_token }); // Debug 6: Before API call

      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(requestPayload),
      });
      const data = await response.json();
      console.log('[handleSubmit] API Response:', { status: response.status, data }); // Debug 7: API response

      if (!response.ok) {
        await supabase
          .from('credits')
          .update({ credit_balance: credit })
          .eq('user_id', userId);
        setCredit(credit);
        setError(data.error || 'Form submission failed.');
      } else {
        setResult(data.result);
      }
    } catch (err) {
      setError('An error occurred: ' + err.message);
      await supabase
        .from('credits')
        .update({ credit_balance: credit })
        .eq('user_id', userId);
      setCredit(credit);
      console.error('[handleSubmit] Error:', err); // Debug 8: Catch block
    }
  };

  if (!userId) {
    return <div>Loading...</div>;
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