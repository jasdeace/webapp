// api/submit-form.js
import { supabase } from '../../utils/supabaseClient'; // Adjust path if needed

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, formData, credit_balance } = req.body;

  if (!userId || !formData) {
    return res.status(400).json({ error: 'Missing userId or formData' });
  }

  try {
    // Get the auth token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid auth token' });
    }

    const token = authHeader.split('Bearer ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'User not found or unauthorized' });
    }

    // Verify userId matches the authenticated user
    if (user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: User ID mismatch' });
    }

    // Verify credits with Prefer: return=representation and ensure RLS visibility
    const { data: creditData, error: creditError } = await supabase
      .from('credits')
      .select('credit_balance')
      .eq('user_id', userId)
      .single();

    console.log('API Credit Data:', creditData, 'Credit Error:', creditError); // Debug API query

    if (creditError || !creditData) {
      return res.status(400).json({ error: 'Credit record not found' });
    }

    // Ensure credit_balance matches the expected value (e.g., 10)
    if (creditData.credit_balance !== credit_balance) {
      return res.status(400).json({ error: 'Credit balance mismatch' });
    }

    // Process form data (e.g., save to 'forms' table)
    const { error: formError } = await supabase
      .from('forms') // Assuming a 'forms' table for submissions
      .insert({ user_id: userId, form_data: formData, credit_balance: creditData.credit_balance });

    if (formError) {
      throw formError;
    }

    res.status(200).json({ result: 'Form submitted successfully', credit_balance: creditData.credit_balance });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}