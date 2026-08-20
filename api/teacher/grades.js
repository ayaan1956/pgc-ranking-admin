import supabase from '../db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    // Verify teacher
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id, active')
      .eq('user_id', user.id)
      .single();

    if (!teacher || !teacher.active) return res.status(403).json({ error: 'Not authorized: active teacher account required' });

    if (req.method === 'GET') {
      // Not used in current design — teacher page fetches directly via Supabase client
      const { data, error } = await supabase
        .from('subject_grades')
        .select('*')
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { teacher_id, student_id, subject, domain, grade, max_grade, term, notes } = req.body;

      if (!teacher_id || !student_id || !subject || !grade || !max_grade || !term) {
        return res.status(400).json({ error: 'teacher_id, student_id, subject, grade, max_grade, and term are required' });
      }

      // Verify the teacher_id matches the authenticated teacher
      if (teacher_id !== teacher.id) {
        return res.status(403).json({ error: 'Teacher ID mismatch' });
      }

      const { data, error } = await supabase
        .from('subject_grades')
        .insert({
          teacher_id,
          student_id,
          subject,
          domain: domain || '',
          grade: parseFloat(grade),
          max_grade: parseFloat(max_grade),
          term,
          notes: notes || '',
          created_by: user.id,
          approved: false,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Teacher grades API error:', err);
    res.status(500).json({ error: err.message });
  }
}
