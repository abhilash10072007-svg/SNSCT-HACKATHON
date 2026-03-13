import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDoubt } from '../utils/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Other'];

export default function CreateDoubt() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', content: '', subject: '', tags: [], priority: 'medium', isAnonymous: false
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [similarDoubts, setSimilarDoubts] = useState([]);

  useEffect(() => {
    if (!form.title || form.title.length < 10) {
      setSimilarDoubts([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/doubts/similar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: form.title,
            content: form.content,
            subject: form.subject
          })
        });
        const data = await response.json();
        setSimilarDoubts(data.similar || []);
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [form.title, form.content, form.subject]);

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
        setForm(f => ({ ...f, tags: [...f.tags, tag] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject) return toast.error('Please select a subject');
    setLoading(true);
    try {
      const res = await createDoubt(form);
      toast.success('Doubt posted successfully! 🎉');
      navigate(`/doubts/${res.data.doubt._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post doubt');
    }
    setLoading(false);
  };

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1 className="page-title">Ask a Doubt</h1>
        <p className="page-subtitle">Be specific. Good doubts get great answers.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title <span style={{ color: 'var(--red)' }}>*</span></label>
            <input
              className="form-input"
              placeholder="What's your doubt? Be specific (min 10 characters)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              minLength={10}
              maxLength={200}
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {form.title.length}/200
            </div>
          </div>

          {/* Similar Doubts Widget */}
          {similarDoubts.length > 0 && (
            <div style={{
              background: 'rgba(255,200,0,0.05)',
              border: '1px solid rgba(255,200,0,0.2)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16
            }}>
              <p style={{ fontSize: 13, color: '#ffc800', marginBottom: 10, fontWeight: 600 }}>
                ⚠️ Similar doubts already exist — check before posting:
              </p>
              {similarDoubts.map(d => (
  <a
    key={d._id}
    href={`/doubts/${d._id}`}
    target="_blank"
    rel="noreferrer"
    style={{
      display: 'block',
      padding: '8px 12px',
      marginBottom: 6,
      background: 'var(--bg-hover)',
      borderRadius: 8,
      fontSize: 13,
      color: 'var(--text-primary)',
      textDecoration: 'none',
      border: '1px solid var(--border)'
    }}
  >
    📌 {d.title}
    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
      {d.answerCount} answers • {d.subject}
    </span>
  </a>
))}
            </div>
          )}

          {/* Subject + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Subject <span style={{ color: 'var(--red)' }}>*</span></label>
              <select
                className="form-input filter-select"
                style={{ width: '100%' }}
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                required
              >
                <option value="">Select a subject</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-input filter-select"
                style={{ width: '100%' }}
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description <span style={{ color: 'var(--red)' }}>*</span></label>
            <textarea
              className="form-input form-textarea"
              placeholder="Explain your doubt in detail. Include what you've already tried, what you expected, and what happened instead."
              rows={8}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              required
              minLength={20}
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {form.content.length} characters (min 20)
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags (up to 5)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {form.tags.map(tag => (
                <span key={tag} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            {form.tags.length < 5 && (
              <input
                className="form-input"
                placeholder="Type a tag and press Enter (e.g. calculus, newton-laws)"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
                style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
              />
              <span>Post anonymously <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>(your name won't show)</span></span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/doubts')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={loading}>
                {loading ? 'Posting...' : 'Post Doubt →'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tips */}
      <div style={{ background: 'var(--cyan-dim)', border: '1px solid rgba(62,207,255,0.2)', borderRadius: 12, padding: 20, marginTop: 20 }}>
        <h4 style={{ color: 'var(--cyan)', fontSize: 14, fontWeight: 600, marginBottom: 10 }}>💡 Tips for a great doubt</h4>
        <ul style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Be specific in your title — avoid vague titles like "Help me"</li>
          <li>Include relevant context and what you've already tried</li>
          <li>Use tags to help others find your doubt</li>
          <li>Doubts with more detail get answered faster</li>
        </ul>
      </div>
    </div>
  );
}