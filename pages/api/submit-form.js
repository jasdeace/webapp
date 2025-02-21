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
    // Verify the user exists in auth.users
    const { data: user, error: userError } = await supabase.auth.getUser(userId);

    if (userError || !user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Optionally verify credits (though client already checks)
    const { data: creditData, error: creditError } = await supabase
      .from('credits')
      .select('credit_balance')
      .eq('user_id', userId)
      .single();

    if (creditError || !creditData) {
      return res.status(400).json({ error: 'Credit record not found' });
    }

    // Process form data (e.g., save to another table like 'forms')
    const { error: formError } = await supabase
      .from('forms') // Assuming a 'forms' table for submissions
      .insert({ user_id: userId, form_data: formData, credit_balance: credit_balance });

    if (formError) {
      throw formError;
    }

    res.status(200).json({ result: 'Form submitted successfully', credit_balance: creditData.credit_balance });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}