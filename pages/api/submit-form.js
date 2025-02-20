// pages/api/submit-form.js
import { supabase } from '../../utils/supabaseClient';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userId, formData } = req.body;
    const creditCost = 10;  // set your cost per submission

    // Get the user's profile and credit
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (profile.credit < creditCost) {
      return res.status(400).json({ error: 'Insufficient credit' });
    }

    // Deduct credit
    const updatedCredit = profile.credit - creditCost;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credit: updatedCredit })
      .eq('id', userId);
      
    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // Send form data to third-party processing (replace the URL with your actual endpoint)
    let thirdPartyResponse;
    try {
      thirdPartyResponse = await axios.post('https://thirdparty.example.com/process', formData);
    } catch (err) {
      return res.status(500).json({ error: 'Error processing form' });
    }

    // Save form submission and result in Supabase
    const { data: formSubmission, error: formError } = await supabase
      .from('forms')
      .insert([{ user_id: userId, form_data: formData, result: thirdPartyResponse.data }]);

    if (formError) {
      return res.status(500).json({ error: formError.message });
    }

    return res.status(200).json({ message: 'Form processed', result: thirdPartyResponse.data });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
