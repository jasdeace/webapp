// api/submit-form.js
import { supabase } from '../../utils/supabaseClient'; // Adjust path if needed

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { userId, formData, credit_balance } = req.body;
    console.log('API Request Body:', { userId, formData, credit_balance });
  
    if (!userId || !formData) {
      return res.status(400).json({ error: 'Missing userId or formData' });
    }
  
    try {
      const authHeader = req.headers.authorization;
      console.log('API Authorization Header:', authHeader);
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No valid auth token' });
      }
  
      const token = authHeader.split('Bearer ')[1];
      console.log('API Token:', token);
  
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      console.log('API Auth User Data:', user, 'Auth User Error:', userError);
      if (userError || !user) {
        return res.status(401).json({ error: 'Unauthorized: ' + (userError?.message || 'No user data') });
      }
  
      if (user.id !== userId) {
        return res.status(403).json({ error: 'Unauthorized: User ID mismatch' });
      }
  
      console.log('API Before setAuth:', { userId });
      supabase.auth.setAuth(token);
      console.log('API After setAuth:', { userId }); // New log
  
      console.log('API Before Credits Query:', { userId });
      const { data: creditData, error: creditError } = await supabase
        .from('credits')
        .select('credit_balance')
        .eq('user_id', userId)
        .single();
      console.log('API Credit Data:', creditData, 'Credit Error:', creditError);
  
      if (creditError) {
        return res.status(400).json({ error: 'Credit check failed: ' + creditError.message });
      }
      if (!creditData) {
        return res.status(400).json({ error: 'No credit record found' });
      }
  
      if (creditData.credit_balance !== credit_balance) {
        return res.status(400).json({ error: `Credit balance mismatch: Expected ${credit_balance}, got ${creditData.credit_balance}` });
      }
  
      // const { error: formError } = await supabase
      //  .from('forms')
      //  .insert({ user_id: userId, form_data: formData, credit_balance: credit_balance });
      //console.log('Form Insert Error:', formError);
      //if (formError) {
      //  return res.status(500).json({ error: 'Failed to save form: ' + formError.message });
      //}
  
      res.status(200).json({ result: 'Form submitted successfully', credit_balance: creditData.credit_balance });
    } catch (err) {
      console.error('API Full Error:', err.stack || err);
      res.status(500).json({ error: 'Internal server error: ' + (err.message || 'Unknown error') });
    }
  }