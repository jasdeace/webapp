import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function TopUp() {
  const [userId, setUserId] = useState(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  // Get the current logged-in user
  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (err) {
        setMessage('Error fetching user: ' + err.message);
      }
    }
    getUser();
  }, []);

  const handleTopUp = async (e) => {
    e.preventDefault();
    if (!userId) {
      setMessage('You must be logged in to top up.');
      return;
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setMessage('Please enter a valid top-up amount.');
      return;
    }
    try {
      const response = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: parseFloat(amount) }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Top-up failed.');
      } else {
        setMessage('Top-up successful! Your new balance is: ' + data.newCredit);
      }
    } catch (err) {
      setMessage('An error occurred during top-up: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
      <h1>Top Up</h1>
      <form onSubmit={handleTopUp}>
        <input
          type="number"
          placeholder="Enter amount to top up"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />
        <button type="submit" style={{ width: '100%', padding: '0.5rem' }}>
          Top Up
        </button>
      </form>
      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </div>
  );
}