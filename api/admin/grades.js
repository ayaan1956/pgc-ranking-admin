import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data: admin } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!admin) return res.status(403).json({ error: 'Not authorized: admin access required' });

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('subject_grades')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const { id, action, rejection_reason } = req.body;
      if (!id || !action) return res.status(400).json({ error: 'ID and action are required' });

      if (action === 'approve') {
        const { data, error } = await supabase
          .from('subject_grades')
          .update({
            approved: true,
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            rejection_reason: '',
          })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      if (action === 'reject') {
        if (!rejection_reason) return res.status(400).json({ error: 'rejection_reason is required' });
        const { data, error } = await supabase
          .from('subject_grades')
          .update({
            approved: false,
            approved_by: null,
            approved_at: null,
            rejection_reason,
          })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      res.status(400).json({ error: 'Invalid action' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Grades API error:', err);
    res.status(500).json({ error: err.message });
  }
}
