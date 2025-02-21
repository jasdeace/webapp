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
    console.log('API Authorization Header:', authHeader); // Debug auth header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid auth token' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('API Token:', token); // Debug token

    // Set the Supabase client with the auth token for RLS context
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    console.log('API Auth User Data:', user, 'Auth User Error:', userError); // Debug auth

    if (userError || !user) {
      return res.status(401).json({ error: 'User not found or unauthorized' });
    }

    // Verify userId matches the authenticated user
    if (user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: User ID mismatch' });
    }

    // Set the auth context for the Supabase client to ensure RLS uses auth.uid()
    supabase.auth.setAuth(token); // Explicitly set the token for the client

    // Verify credits with Prefer: return=representation and ensure RLS visibility
    const { data: creditData, error: creditError } = await supabase
      .from('credits')
      .select('credit_balance')
      .eq('user_id', userId)
      .single();

    console.log('API Credit Data:', creditData, 'Credit Error:', creditError); // Debug credits query

    if (creditError || !creditData) {
      return res.status(400).json({ error: 'Credit record not found' });
    }

    // Ensure credit_balance matches the expected value (e.g., 10)
    if (creditData.credit_balance !== credit_balance) {
      return res.status(400).json({ error: 'Credit balance mismatch' });
    }

    // Add a small delay to ensure update visibility (temporary debug)
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay

    // Re-verify credits after delay to ensure visibility
    const { data: finalCreditData, error: finalCreditError } = await supabase
      .from('credits')
      .select('credit_balance')
      .eq('user_id', userId)
      .single();

    console.log('Final API Credit Data:', finalCreditData, 'Final Credit Error:', finalCreditError);

    if (finalCreditError || !finalCreditData) {
      return res.status(400).json({ error: 'Credit record not found after verification' });
    }

    if (finalCreditData.credit_balance !== credit_balance) {
      return res.status(400).json({ error: 'Credit balance mismatch after verification' });
    }

    // Process form data (e.g., save to 'forms' table)
    const { error: formError } = await supabase
      .from('forms') // Assuming a 'forms' table for submissions
      .insert({ user_id: userId, form_data: formData, credit_balance: credit_balance });

    if (formError) {
      throw formError;
    }

    res.status(200).json({ result: 'Form submitted successfully', credit_balance: finalCreditData.credit_balance });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}