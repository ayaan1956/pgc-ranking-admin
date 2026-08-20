import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import {
  Award, LogOut, Plus, Check, X,
  Loader2, AlertCircle, Save, FileText
} from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Grade {
  id: number;
  student_id: number;
  teacher_id: number;
  subject: string;
  domain: string;
  grade: number;
  max_grade: number;
  term: string;
  notes: string;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string;
  created_by: string | null;
  created_at: string;
}

interface TeacherInfo {
  id: number;
  name: string;
  subject: string;
  domain: string;
}

export default function Teacher() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    subject: '',
    domain: '',
    grade: '',
    max_grade: '100',
    term: 'Fall 2025',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchTeacherAndGrades = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not logged in');

      const tRes = await supabase.from('teachers').select('*').eq('user_id', session.user.id).single();
      if (tRes.error) throw tRes.error;
      if (tRes.data) {
        setTeacher({
          id: tRes.data.id,
          name: tRes.data.name,
          subject: tRes.data.subject,
          domain: tRes.data.domain,
        });
      }

      const gradesRes = await supabase
        .from('subject_grades')
        .select('*')
        .eq('teacher_id', tRes.data?.id || 0)
        .order('created_at', { ascending: false });

      if (gradesRes.error) throw gradesRes.error;
      setGrades(gradesRes.data || []);
    } catch (e: any) {
      setError('Failed to load: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeacherAndGrades(); }, [fetchTeacherAndGrades]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.subject || !form.grade) {
      setError('Student, Subject, and Grade are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/teacher/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacher?.id,
          student_id: Number(form.student_id),
          subject: form.subject,
          domain: form.domain,
          grade: Number(form.grade),
          max_grade: Number(form.max_grade),
          term: form.term,
          notes: form.notes,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit grade');
      }
      setSuccess('Grade submitted for review.');
      setShowForm(false);
      setForm({ student_id: '', subject: '', domain: '', grade: '', max_grade: '100', term: 'Fall 2025', notes: '' });
      fetchTeacherAndGrades();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F7A3D]" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[#C8102E]" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Teacher profile not found</h2>
          <p className="text-gray-500 mb-4">Your account has not been set up as a teacher. Please contact your administrator.</p>
          <button onClick={handleLogout} className="px-4 py-2 bg-[#0F7A3D] text-white rounded-lg text-sm font-medium">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-xs text-gray-500">
                  Hi {teacher.name} &mdash; {teacher.subject}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
            <Check className="w-4 h-4 shrink-0" />
            {success}
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#0F7A3D]" />
              Grade Entry
            </h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 py-2 px-4 bg-[#0F7A3D] hover:bg-[#0a6230] text-white rounded-lg text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" />
                New Grade Entry
              </button>
            )}
          </div>

          {showForm ? (
            <form onSubmit={handleSubmitGrade} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={form.student_id}
                  onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
                  required
                >
                  <option value="">Select Student</option>
                </select>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                  <input
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder={teacher.subject}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Domain</label>
                  <input
                    value={form.domain}
                    onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                    placeholder={teacher.domain || 'General'}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
                  <input
                    type="number"
                    value={form.grade}
                    onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Grade</label>
                  <input
                    type="number"
                    value={form.max_grade}
                    onChange={e => setForm(f => ({ ...f, max_grade: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
                  <input
                    value={form.term}
                    onChange={e => setForm(f => ({ ...f, term: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm resize-none h-20"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-[#0F7A3D] hover:bg-[#0a6230] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Submit Grade</>}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setForm({ student_id: '', subject: '', domain: '', grade: '', max_grade: '100', term: 'Fall 2025', notes: '' }); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Click "New Grade Entry" to submit a grade for approval.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0F7A3D]" />
              My Submissions
            </h2>
          </div>
          {grades.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              No grade submissions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="text-left p-3">Student</th>
                    <th className="text-left p-3">Subject</th>
                    <th className="text-left p-3 hidden sm:table-cell">Domain</th>
                    <th className="text-left p-3">Grade</th>
                    <th className="text-left p-3 hidden md:table-cell">Term</th>
                    <th className="text-left p-3 hidden lg:table-cell">Status</th>
                    <th className="text-left p-3 hidden lg:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map(g => (
                    <tr key={g.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-3 font-medium text-gray-900">Student #{g.student_id}</td>
                      <td className="p-3 text-gray-700">{g.subject}</td>
                      <td className="p-3 text-gray-600 hidden sm:table-cell">{g.domain}</td>
                      <td className="p-3 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-xs ${g.approved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-800'
                        }`}>
                          {g.grade}/{g.max_grade}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 hidden md:table-cell">{g.term}</td>
                      <td className="p-3 hidden lg:table-cell">
                        {g.approved ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                            <Check className="w-3 h-3" /> Approved
                          </span>
                        ) : g.rejection_reason ? (
                          <span className="inline-flex items-center gap-1 text-red-600 text-xs">
                            <X className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-xs">
                            <Loader2 className="w-3 h-3 animate-spin" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-500 max-w-xs truncate hidden lg:table-cell">{g.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
