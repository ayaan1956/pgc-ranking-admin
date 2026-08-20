import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, Medal, Award, UsersRound,
  Plus, Edit2, Trash2, LogOut, Check, X,
  Loader2, AlertCircle, Search, Save
} from 'lucide-react';

type Tab = 'students' | 'scores' | 'grades' | 'teachers';

interface Student {
  id: number;
  name: string;
  roll_number: string;
  class: string;
  group_name: string;
  campus: string;
  initials: string;
  created_at: string;
}

interface Score {
  id: number;
  student_id: number;
  domain: string;
  points: number;
  event_name: string;
  event_date: string;
  position: number;
  description: string;
  notes: string;
  created_at: string;
}

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

interface Teacher {
  id: number;
  user_id: string;
  name: string;
  subject: string;
  domain: string;
  campus: string;
  is_head: boolean;
  active: boolean;
  created_at: string;
}

const LOADING_SKELETON = Array.from({ length: 5 }, (_, i) => ({ id: i }));

export default function Admin() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('students');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Student form
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', roll_number: '', class: '', group_name: 'General', campus: 'Main', initials: '' });
  const [savingStudent, setSavingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Score form
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [scoreForm, setScoreForm] = useState({ student_id: '', domain: '', points: '', event_name: '', event_date: '', position: '0', description: '', notes: '' });
  const [savingScore, setSavingScore] = useState(false);

  // Grade form (teacher-side via teacher page, but admin can see)
  // Teacher form
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ name: '', subject: '', domain: '', campus: 'Main', is_head: false });
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Grade action
  const [rejectingGrade, setRejectingGrade] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, scRes, gRes, tRes] = await Promise.all([
        fetch('/api/admin/students').then(r => r.json()),
        fetch('/api/admin/scores').then(r => r.json()),
        fetch('/api/admin/grades').then(r => r.json()),
        fetch('/api/admin/teachers').then(r => r.json()),
      ]);
      setStudents(sRes);
      setScores(scRes);
      setGrades(gRes);
      setTeachers(tRes);
    } catch (e: any) {
      setError('Failed to load data: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // --- Student CRUD ---
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name.trim() || !studentForm.roll_number.trim() || !studentForm.class.trim()) {
      setError('Name, Roll Number, and Class are required.');
      return;
    }
    setSavingStudent(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm),
      });
      if (!res.ok) throw new Error('Failed to add student');
      setSuccess('Student added successfully.');
      setShowStudentForm(false);
      setStudentForm({ name: '', roll_number: '', class: '', group_name: 'General', campus: 'Main', initials: '' });
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStudent(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingStudent(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingStudent }),
      });
      if (!res.ok) throw new Error('Failed to update student');
      setSuccess('Student updated.');
      setEditingStudent(null);
      setShowStudentForm(false);
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStudent(false);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Delete this student?')) return;
    try {
      const res = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Student deleted.');
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- Score CRUD ---
  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreForm.student_id || !scoreForm.domain || !scoreForm.points || !scoreForm.event_name || !scoreForm.event_date) {
      setError('All score fields are required.');
      return;
    }
    setSavingScore(true);
    try {
      const res = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: Number(scoreForm.student_id),
          domain: scoreForm.domain,
          points: Number(scoreForm.points),
          event_name: scoreForm.event_name,
          event_date: scoreForm.event_date,
          position: Number(scoreForm.position),
          description: scoreForm.description,
          notes: scoreForm.notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to add score');
      setSuccess('Score added.');
      setShowScoreForm(false);
      setScoreForm({ student_id: '', domain: '', points: '', event_name: '', event_date: '', position: '0', description: '', notes: '' });
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingScore(false);
    }
  };

  const handleDeleteScore = async (id: number) => {
    if (!confirm('Delete this score record?')) return;
    try {
      const res = await fetch('/api/admin/scores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Score deleted.');
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- Grade actions ---
  const handleApproveGrade = async (id: number) => {
    try {
      const res = await fetch('/api/admin/grades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      setSuccess('Grade approved.');
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRejectGrade = async (id: number) => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }
    try {
      const res = await fetch('/api/admin/grades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', rejection_reason: rejectReason }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      setSuccess('Grade rejected.');
      setRejectReason('');
      setRejectingGrade(null);
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- Teacher CRUD ---
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.name.trim() || !teacherForm.subject.trim()) {
      setError('Name and Subject are required.');
      return;
    }
    setSavingTeacher(true);
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherForm),
      });
      if (!res.ok) throw new Error('Failed to add teacher');
      setSuccess('Teacher added.');
      setShowTeacherForm(false);
      setTeacherForm({ name: '', subject: '', domain: '', campus: 'Main', is_head: false });
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingTeacher(false);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setSavingTeacher(true);
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingTeacher }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setSuccess('Teacher updated.');
      setEditingTeacher(null);
      setShowTeacherForm(false);
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingTeacher(false);
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (!confirm('Delete this teacher?')) return;
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Teacher deleted.');
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (teacher: Teacher) => {
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teacher.id, active: !teacher.active }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      setSuccess(`Teacher ${!teacher.active ? 'activated' : 'deactivated'}.`);
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- Render helpers ---
  const renderStudentForm = () => {
    const isEdit = !!editingStudent;
    return (
      <form onSubmit={isEdit ? handleEditStudent : handleAddStudent} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            placeholder="Full Name *"
            value={isEdit ? editingStudent.name : studentForm.name}
            onChange={e => isEdit ? setEditingStudent({ ...editingStudent!, name: e.target.value }) : setStudentForm(f => ({ ...f, name: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
            required
          />
          <input
            placeholder="Roll Number *"
            value={isEdit ? editingStudent.roll_number : studentForm.roll_number}
            onChange={e => isEdit ? setEditingStudent({ ...editingStudent!, roll_number: e.target.value }) : setStudentForm(f => ({ ...f, roll_number: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
            required
          />
          <input
            placeholder="Class (e.g. 10-A) *"
            value={isEdit ? editingStudent.class : studentForm.class}
            onChange={e => isEdit ? setEditingStudent({ ...editingStudent!, class: e.target.value }) : setStudentForm(f => ({ ...f, class: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
            required
          />
          <input
            placeholder="Group Name"
            value={isEdit ? editingStudent.group_name : studentForm.group_name}
            onChange={e => isEdit ? setEditingStudent({ ...editingStudent!, group_name: e.target.value }) : setStudentForm(f => ({ ...f, group_name: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
          />
          <input
            placeholder="Campus"
            value={isEdit ? editingStudent.campus : studentForm.campus}
            onChange={e => isEdit ? setEditingStudent({ ...editingStudent!, campus: e.target.value }) : setStudentForm(f => ({ ...f, campus: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
          />
          <input
            placeholder="Initials"
            value={isEdit ? editingStudent.initials : studentForm.initials}
            onChange={e => isEdit ? setEditingStudent({ ...editingStudent!, initials: e.target.value }) : setStudentForm(f => ({ ...f, initials: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={savingStudent} className="flex-1 py-2 bg-[#0F7A3D] hover:bg-[#0a6230] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-60">
            {savingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Add'} Student</>}
          </button>
          {isEdit && (
            <button type="button" onClick={() => { setEditingStudent(null); setShowStudentForm(false); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  };

  const renderScoreForm = () => (
    <form onSubmit={handleAddScore} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={scoreForm.student_id}
          onChange={e => setScoreForm(f => ({ ...f, student_id: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
          required
        >
          <option value="">Select Student</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
        </select>
        <input
          placeholder="Domain (e.g. Sports, Debate)"
          value={scoreForm.domain}
          onChange={e => setScoreForm(f => ({ ...f, domain: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
          required
        />
        <input
          type="number"
          placeholder="Points *"
          value={scoreForm.points}
          onChange={e => setScoreForm(f => ({ ...f, points: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
          required
        />
        <input
          placeholder="Event Name *"
          value={scoreForm.event_name}
          onChange={e => setScoreForm(f => ({ ...f, event_name: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
          required
        />
        <input
          type="date"
          value={scoreForm.event_date}
          onChange={e => setScoreForm(f => ({ ...f, event_date: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
          required
        />
        <input
          type="number"
          placeholder="Position"
          value={scoreForm.position}
          onChange={e => setScoreForm(f => ({ ...f, position: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
        />
        <input
          placeholder="Description"
          value={scoreForm.description}
          onChange={e => setScoreForm(f => ({ ...f, description: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm sm:col-span-2"
        />
        <input
          placeholder="Notes"
          value={scoreForm.notes}
          onChange={e => setScoreForm(f => ({ ...f, notes: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm sm:col-span-2"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={savingScore} className="flex-1 py-2 bg-[#0F7A3D] hover:bg-[#0a6230] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-60">
          {savingScore ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Add Score</>}
        </button>
        <button type="button" onClick={() => { setShowScoreForm(false); setScoreForm({ student_id: '', domain: '', points: '', event_name: '', event_date: '', position: '0', description: '', notes: '' }); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );

  const renderTeacherForm = () => {
    const isEdit = !!editingTeacher;
    return (
      <form onSubmit={isEdit ? handleEditTeacher : handleAddTeacher} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            placeholder="Full Name *"
            value={isEdit ? editingTeacher.name : teacherForm.name}
            onChange={e => isEdit ? setEditingTeacher({ ...editingTeacher!, name: e.target.value }) : setTeacherForm(f => ({ ...f, name: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
            required
          />
          <input
            placeholder="Subject *"
            value={isEdit ? editingTeacher.subject : teacherForm.subject}
            onChange={e => isEdit ? setEditingTeacher({ ...editingTeacher!, subject: e.target.value }) : setTeacherForm(f => ({ ...f, subject: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
            required
          />
          <input
            placeholder="Domain"
            value={isEdit ? editingTeacher.domain : teacherForm.domain}
            onChange={e => isEdit ? setEditingTeacher({ ...editingTeacher!, domain: e.target.value }) : setTeacherForm(f => ({ ...f, domain: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
          />
          <input
            placeholder="Campus"
            value={isEdit ? editingTeacher.campus : teacherForm.campus}
            onChange={e => isEdit ? setEditingTeacher({ ...editingTeacher!, campus: e.target.value }) : setTeacherForm(f => ({ ...f, campus: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F7A3D] outline-none text-sm"
          />
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_head"
              checked={isEdit ? editingTeacher.is_head : teacherForm.is_head}
              onChange={e => isEdit ? setEditingTeacher({ ...editingTeacher!, is_head: e.target.checked }) : setTeacherForm(f => ({ ...f, is_head: e.target.checked }))}
              className="w-4 h-4 accent-[#0F7A3D]"
            />
            <label htmlFor="is_head" className="text-sm text-gray-700">Head Teacher</label>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={savingTeacher} className="flex-1 py-2 bg-[#0F7A3D] hover:bg-[#0a6230] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-60">
            {savingTeacher ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Add'} Teacher</>}
          </button>
          {isEdit && (
            <button type="button" onClick={() => { setEditingTeacher(null); setShowTeacherForm(false); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-3">
      {LOADING_SKELETON.map(i => (
        <div key={i.id} className="animate-pulse flex gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );

  // --- Tab content ---
  const tabContent = () => {
    if (loading) return <div className="py-12">{renderSkeleton()}</div>;

    switch (activeTab) {
      case 'students':
        return (
          <div className="space-y-4">
            {showStudentForm ? (
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0F7A3D]" />
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h3>
                {renderStudentForm()}
              </div>
            ) : (
              <button
                onClick={() => { setEditingStudent(null); setShowStudentForm(true); }}
                className="flex items-center gap-2 py-2 px-4 bg-[#0F7A3D] hover:bg-[#0a6230] text-white rounded-lg text-sm font-medium transition w-fit"
              >
                <Plus className="w-4 h-4" /> Add Student
              </button>
            )}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="text-left p-3">Student</th>
                      <th className="text-left p-3 hidden sm:table-cell">Roll No</th>
                      <th className="text-left p-3 hidden md:table-cell">Class</th>
                      <th className="text-left p-3 hidden lg:table-cell">Group</th>
                      <th className="text-left p-3 hidden lg:table-cell">Campus</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">No students registered yet.</td>
                      </tr>
                    ) : (
                      students.map(s => (
                        <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#0F7A3D] text-white flex items-center justify-center text-sm font-bold shrink-0">
                                {s.initials || s.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{s.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-600 hidden sm:table-cell">{s.roll_number}</td>
                          <td className="p-3 text-gray-600 hidden md:table-cell">{s.class}</td>
                          <td className="p-3 text-gray-600 hidden lg:table-cell">{s.group_name}</td>
                          <td className="p-3 text-gray-600 hidden lg:table-cell">{s.campus}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => { setEditingStudent(s); setShowStudentForm(true); }} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteStudent(s.id)} className="p-1.5 rounded hover:bg-red-50 text-[#C8102E] transition ml-1" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'scores':
        return (
          <div className="space-y-4">
            {showScoreForm ? (
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Medal className="w-5 h-5 text-[#0F7A3D]" />
                  Add Score Record
                </h3>
                {renderScoreForm()}
              </div>
            ) : (
              <button
                onClick={() => setShowScoreForm(true)}
                className="flex items-center gap-2 py-2 px-4 bg-[#0F7A3D] hover:bg-[#0a6230] text-white rounded-lg text-sm font-medium transition w-fit"
              >
                <Plus className="w-4 h-4" /> Add Score
              </button>
            )}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="text-left p-3">Student</th>
                      <th className="text-left p-3">Event</th>
                      <th className="text-left p-3 hidden sm:table-cell">Domain</th>
                      <th className="text-left p-3">Points</th>
                      <th className="text-left p-3 hidden md:table-cell">Date</th>
                      <th className="text-left p-3 hidden lg:table-cell">Position</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400">No scores recorded yet.</td>
                      </tr>
                    ) : (
                      scores.map(sc => {
                        const student = students.find(s => s.id === sc.student_id);
                        return (
                          <tr key={sc.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                            <td className="p-3 font-medium text-gray-900">{student?.name || 'Unknown'}</td>
                            <td className="p-3 text-gray-700">{sc.event_name}</td>
                            <td className="p-3 text-gray-600 hidden sm:table-cell">{sc.domain}</td>
                            <td className="p-3 font-semibold text-[#0F7A3D]">{sc.points}</td>
                            <td className="p-3 text-gray-600 hidden md:table-cell">{sc.event_date}</td>
                            <td className="p-3 text-gray-600 hidden lg:table-cell">{sc.position || '-'}</td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleDeleteScore(sc.id)} className="p-1.5 rounded hover:bg-red-50 text-[#C8102E] transition" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'grades':
        const pendingGrades = grades.filter(g => !g.approved);
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#0F7A3D]" />
                  Pending Grade Approvals
                </h3>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                  {pendingGrades.length} pending
                </span>
              </div>
              {pendingGrades.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Award className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  No pending grade approvals.
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
                        <th className="text-left p-3 hidden lg:table-cell">Notes</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingGrades.map(g => (
                        <tr key={g.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                          <td className="p-3 font-medium text-gray-900">Student #{g.student_id}</td>
                          <td className="p-3 text-gray-700">{g.subject}</td>
                          <td className="p-3 text-gray-600 hidden sm:table-cell">{g.domain}</td>
                          <td className="p-3 font-semibold">
                            <span className="bg-[#0F7A3D] text-white px-2 py-0.5 rounded text-xs">{g.grade}/{g.max_grade}</span>
                          </td>
                          <td className="p-3 text-gray-600 hidden md:table-cell">{g.term}</td>
                          <td className="p-3 text-gray-500 max-w-xs truncate hidden lg:table-cell">{g.notes}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleApproveGrade(g.id)}
                              className="p-1.5 rounded hover:bg-green-50 text-green-600 transition"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <div className="relative inline-block">
                              <button
                                onClick={() => { setRejectingGrade(g.id); setRejectReason(''); }}
                                className="p-1.5 rounded hover:bg-red-50 text-[#C8102E] transition"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              {rejectingGrade === g.id && (
                                <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
                                  <p className="text-xs font-medium text-gray-700 mb-2">Rejection reason:</p>
                                  <textarea
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs resize-none h-16"
                                    placeholder="Enter reason..."
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() => handleRejectGrade(g.id)}
                                      className="flex-1 py-1 bg-[#C8102E] hover:bg-[#a00e26] text-white text-xs rounded"
                                    >
                                      Confirm Reject
                                    </button>
                                    <button
                                      onClick={() => { setRejectingGrade(null); setRejectReason(''); }}
                                      className="px-2 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'teachers':
        return (
          <div className="space-y-4">
            {showTeacherForm ? (
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <UsersRound className="w-5 h-5 text-[#0F7A3D]" />
                  {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                </h3>
                {renderTeacherForm()}
              </div>
            ) : (
              <button
                onClick={() => { setEditingTeacher(null); setShowTeacherForm(true); }}
                className="flex items-center gap-2 py-2 px-4 bg-[#0F7A3D] hover:bg-[#0a6230] text-white rounded-lg text-sm font-medium transition w-fit"
              >
                <Plus className="w-4 h-4" /> Add Teacher
              </button>
            )}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="text-left p-3">Teacher</th>
                      <th className="text-left p-3 hidden sm:table-cell">Subject</th>
                      <th className="text-left p-3 hidden md:table-cell">Domain</th>
                      <th className="text-left p-3 hidden lg:table-cell">Campus</th>
                      <th className="text-center p-3">Status</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">No teachers registered yet.</td>
                      </tr>
                    ) : (
                      teachers.map(t => (
                        <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center text-sm font-bold shrink-0">
                                {t.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{t.name}</div>
                                {t.is_head && <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">Head</span>}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-600 hidden sm:table-cell">{t.subject}</td>
                          <td className="p-3 text-gray-600 hidden md:table-cell">{t.domain}</td>
                          <td className="p-3 text-gray-600 hidden lg:table-cell">{t.campus}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${t.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${t.active ? 'bg-green-500' : 'bg-red-500'}`} />
                              {t.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleToggleActive(t)}
                              className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition"
                              title={t.active ? 'Deactivate' : 'Activate'}
                            >
                              <UsersRound className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingTeacher(t); setShowTeacherForm(true); }} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteTeacher(t.id)} className="p-1.5 rounded hover:bg-red-50 text-[#C8102E] transition ml-1" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#0F7A3D] rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Punjab Colleges</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.email}
              </span>
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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {[
              { key: 'students', label: 'Students', icon: Users },
              { key: 'scores', label: 'Scores', icon: Medal },
              { key: 'grades', label: 'Grades', icon: Award },
              { key: 'teachers', label: 'Teachers', icon: UsersRound },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as Tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-[#0F7A3D] text-[#0F7A3D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
            <Check className="w-4 h-4 shrink-0" />
            {success}
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {tabContent()}
      </main>
    </div>
  );
}
