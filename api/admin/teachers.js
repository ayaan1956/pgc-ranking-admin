import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
      const { data, error } = await supabase.from('teachers').select('*').order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { user_id, name, subject, domain, campus, is_head } = req.body;
      if (!user_id || !name || !subject) {
        return res.status(400).json({ error: 'user_id, name, and subject are required' });
      }
      const { data, error } = await supabase
        .from('teachers')
        .insert({ user_id, name, subject, domain: domain || '', campus: campus || 'Main', is_head: is_head || false, active: true })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, name, subject, domain, campus, is_head, active } = req.body;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      const { data, error } = await supabase
        .from('teachers')
        .update({ name, subject, domain, campus, is_head, active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID is required' });
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Teachers API error:', err);
    res.status(500).json({ error: err.message });
  }
}
