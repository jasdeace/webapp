// pages/api/topup.js
import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userId, amount } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ error: 'Missing userId or amount' });
    }

    // Fetch current credit from the profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('credit')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Add the top-up amount to the credit
    const newCredit = profile.credit + amount;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credit: newCredit })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ newCredit });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
