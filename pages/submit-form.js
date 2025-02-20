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
  const [credit, setCredit] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function checkUserAndCredit() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/login');
          return;
        }
        setUserId(user.id);

        const { data: credits, error: creditError } = await supabase
          .from('credits')
          .select('credit_balance')
          .eq('user_id', user.id)
          .single();

        if (creditError) throw creditError;
        setCredit(credits.credit_balance || 0);
      } catch (err) {
        setError('Error checking authentication or credit: ' + err.message);
      }
    }
    checkUserAndCredit();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!userId) {
      setError('You must be logged in to submit the form.');
      return;
    }
    if (credit <= 0) {
      setError('Insufficient credits. Please top up before submitting.');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId, formData }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Form submission failed.');
      } else {
        setCredit(credit - 1); // Update locally after success
        setResult(data.result);
      }
    } catch (err) {
      setError('An error occurred: ' + err.message);
    }
  };

  if (!userId) return <div>Loading...</div>;

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