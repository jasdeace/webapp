import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  console.log('API Start:', req.body);
  const { userId, formData } = req.body;

  if (!userId || !formData) {
    return res.status(400).json({ error: 'Missing userId or formData' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid auth token' });
    }

    const token = authHeader.split('Bearer ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized: ' + (userError?.message || 'No user data') });
    }

    if (user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: User ID mismatch' });
    }

    const { data: creditData, error: creditError } = await supabase
      .from('credits')
      .select('credit_balance')
      .eq('user_id', userId)
      .single();
    if (creditError) {
      return res.status(400).json({ error: 'Credit check failed: ' + creditError.message });
    }
    if (!creditData || creditData.credit_balance <= 0) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    const newBalance = creditData.credit_balance - 1;
    const { error: creditUpdateError } = await supabase
      .from('credits')
      .update({ credit_balance: newBalance })
      .eq('user_id', userId);
    if (creditUpdateError) {
      return res.status(500).json({ error: 'Failed to update credits: ' + creditUpdateError.message });
    }

    const { error: formError } = await supabase
      .from('forms')
      .insert({ user_id: userId, form_data: formData });
    if (formError) {
      // Rollback credit on failure
      await supabase.from('credits').update({ credit_balance: creditData.credit_balance }).eq('user_id', userId);
      return res.status(500).json({ error: 'Failed to save form: ' + formError.message });
    }

    res.status(200).json({ result: 'Form submitted successfully', credit_balance: newBalance });
  } catch (err) {
    console.error('API Full Error:', err.stack || err);
    res.status(500).json({ error: 'Internal server error: ' + (err.message || 'Unknown error') });
  }
}