import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      if (!data.user) {
        return res.status(401).json({ error: 'Login failed' });
      }

      // Check role
      const [adminCheck, teacherCheck] = await Promise.all([
        supabase.from('admin_users').select('user_id').eq('user_id', data.user.id).single(),
        supabase.from('teachers').select('id, active').eq('user_id', data.user.id).single(),
      ]);

      let role = null;
      if (adminCheck.data) {
        role = 'admin';
      } else if (teacherCheck.data?.active) {
        role = 'teacher';
      }

      return res.status(200).json({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        role,
        session: data.session?.access_token,
      });
    } catch (err) {
      console.error('Login API error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
