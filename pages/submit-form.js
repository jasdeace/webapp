// pages/submit-form.js
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function SubmitForm() {
  const [formData, setFormData] = useState('');
  const [userId, setUserId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Get the current logged-in user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError('You must be logged in to submit the form.');
      return;
    }
    setError(null);
    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, formData })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error);
      } else {
        setResult(data.result);
      }
    } catch {
      setError('An error occurred.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
      <h1>Submit Form</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <textarea
          value={formData}
          onChange={(e) => setFormData(e.target.value)}
          placeholder="Enter your form data here..."
          rows="6"
          style={{ width: '100%', padding: '0.5rem' }}
        />
        <br />
        <button type="submit" style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
          Submit Form
        </button>
      </form>
      {result && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Processing Result:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
