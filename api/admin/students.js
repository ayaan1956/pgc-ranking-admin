import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // Verify admin
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    // Check admin_users
    const { data: admin } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!admin) return res.status(403).json({ error: 'Not authorized: admin access required' });

    // --- ROUTES ---

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('roster').select('*').order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { name, roll_number, class: className, group_name, campus, initials } = req.body;
      if (!name || !roll_number || !className) {
        return res.status(400).json({ error: 'Name, roll_number, and class are required' });
      }
      const { data, error } = await supabase
        .from('roster')
        .insert({ name, roll_number, class: className, group_name, campus, initials })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, name, roll_number, class: className, group_name, campus, initials } = req.body;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      const { data, error } = await supabase
        .from('roster')
        .update({ name, roll_number, class: className, group_name, campus, initials })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      const { error } = await supabase.from('roster').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Students API error:', err);
    res.status(500).json({ error: err.message });
  }
}
