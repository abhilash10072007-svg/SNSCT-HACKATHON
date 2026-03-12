import { useState, useEffect } from 'react';
import { getProfile, updateProfile, changePassword, getMyDoubts } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: '', bio: '', subjects: [] });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [myDoubts, setMyDoubts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, doubtsRes] = await Promise.all([getProfile(), getMyDoubts()]);
        const u = profileRes.data.user;
        setForm({ name: u.name || '', bio: u.bio || '', subjects: u.subjects || [] });
        setMyDoubts(doubtsRes.data.doubts);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('New passwords do not match');
    setSaving(true);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
    setSaving(false);
  };

  const toggleSubject = (sub) => {
    setForm(f => ({
      ...f,
      subjects: f.subjects.includes(sub) ? f.subjects.filter(s => s !== sub) : [...f.subjects, sub]
    }));
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{user?.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user?.email}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{user?.bio || 'No bio yet'}</p>
          <div className="profile-stats">
            <div className="profile-stat"><div className="val">{user?.reputation || 0}</div><div className="lbl">Reputation</div></div>
            <div className="profile-stat"><div className="val">{user?.doubtsAsked || 0}</div><div className="lbl">Doubts</div></div>
            <div className="profile-stat"><div className="val">{user?.answersGiven || 0}</div><div className="lbl">Answers</div></div>
            <div className="profile-stat"><div className="val">{user?.badges?.length || 0}</div><div className="lbl">Badges</div></div>
          </div>
        </div>
      </div>

      <div className="tabs">
        {['profile', 'doubts', 'security'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'profile' ? '👤 Profile' : t === 'doubts' ? '💬 My Doubts' : '🔒 Security'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card">
          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Bio <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>(optional)</span></label>
              <textarea className="form-input form-textarea" rows={3} maxLength={200} placeholder="Tell others about yourself..."
                value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{form.bio.length}/200</div>
            </div>
            <div className="form-group">
              <label className="form-label">Subjects of Interest</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {SUBJECTS.map(s => (
                  <button
                    key={s} type="button"
                    className={form.subjects.includes(s) ? 'tag subject' : 'tag'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleSubject(s)}
                  >
                    {form.subjects.includes(s) ? '✓ ' : ''}{s}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}

      {tab === 'doubts' && (
        <div>
          {myDoubts.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💬</div>
              <h3>No doubts yet</h3>
              <Link to="/doubts/new" className="btn btn-primary" style={{ width: 'auto', marginTop: 16 }}>Ask your first doubt</Link>
            </div>
          ) : myDoubts.map(d => (
            <Link key={d._id} to={`/doubts/${d._id}`} className="doubt-card" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="tag subject">{d.subject}</span>
                  <span className="doubt-stat" style={{ fontSize: 12 }}>💬 {d.answerCount}</span>
                  <span className="doubt-stat" style={{ fontSize: 12 }}>⬆ {d.upvoteCount}</span>
                </div>
              </div>
              <span className={`tag ${d.status}`}>{d.status}</span>
            </Link>
          ))}
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div className="input-wrapper">
                <input className="form-input" type={showPass ? 'text' : 'password'} required
                  value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
                <button type="button" className="input-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type={showPass ? 'text' : 'password'} required minLength={6}
                value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type={showPass ? 'text' : 'password'} required
                value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
