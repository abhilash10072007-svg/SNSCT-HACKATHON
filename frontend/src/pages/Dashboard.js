import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, CheckCircle, TrendingUp, Clock, Plus, ArrowRight } from 'lucide-react';
import { getDoubts, getMyDoubts } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [recentDoubts, setRecentDoubts] = useState([]);
  const [myDoubts, setMyDoubts] = useState([]);
  const [stats, setStats] = useState({ total: 0, solved: 0, open: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [allRes, myRes] = await Promise.all([
          getDoubts({ limit: 5, sort: '-createdAt' }),
          getMyDoubts()
        ]);
        setRecentDoubts(allRes.data.doubts);
        setMyDoubts(myRes.data.doubts.slice(0, 5));
        const all = myRes.data.doubts;
        setStats({
          total: all.length,
          solved: all.filter(d => d.status === 'solved').length,
          open: all.filter(d => d.status === 'open').length
        });
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="page-container">
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(62,207,255,0.08))',
        border: '1px solid var(--border)', borderRadius: 16,
        padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="profile-avatar" style={{ width: 56, height: 56, fontSize: 20 }}>{initials}</div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {user?.role === 'student' ? 'Keep learning and sharing knowledge' : `${user?.role} • Smart Doubt Exchange`}
            </p>
            <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span className="rep-badge">⚡ {user?.reputation || 0} reputation</span>
              <span className="tag subject">{user?.role}</span>
            </div>
          </div>
        </div>
        <Link to="/doubts/new" className="btn btn-primary" style={{ width: 'auto' }}>
          <Plus size={15} /> Ask a Doubt
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Doubts Asked</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.solved}</div>
          <div className="stat-label">Solved</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔓</div>
          <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{stats.open}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{user?.answersGiven || 0}</div>
          <div className="stat-label">Answers Given</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ height: 200 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="two-col">
          {/* Recent community doubts */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent Doubts</h3>
              <Link to="/doubts" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>

            {recentDoubts.length === 0 ? (
              <div className="empty-state">
                <div className="icon">🤔</div>
                <h3>No doubts yet</h3>
                <p>Be the first to ask!</p>
              </div>
            ) : recentDoubts.map(d => (
              <Link key={d._id} to={`/doubts/${d._id}`} className="doubt-card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <h4 className="doubt-title" style={{ marginBottom: 0 }}>{d.title}</h4>
                  <span className={`tag ${d.status}`} style={{ flexShrink: 0, fontSize: 11 }}>{d.status}</span>
                </div>
                <div className="doubt-meta">
                  <span className="tag subject">{d.subject}</span>
                  <span className="doubt-stat"><MessageSquare size={13} /> {d.answerCount}</span>
                  <span className="doubt-stat"><TrendingUp size={13} /> {d.upvoteCount}</span>
                  <span className="doubt-stat"><Clock size={13} /> {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Sidebar */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>YOUR RECENT DOUBTS</h4>
              {myDoubts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No doubts yet. <Link to="/doubts/new" className="auth-link">Ask one!</Link></p>
              ) : myDoubts.map(d => (
                <Link key={d._id} to={`/doubts/${d._id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
                  <span className={`tag ${d.status}`} style={{ fontSize: 11, marginLeft: 8, flexShrink: 0 }}>{d.status}</span>
                </Link>
              ))}
            </div>

            <div className="card">
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>QUICK ACTIONS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/doubts/new" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                  <Plus size={14} /> Ask a Doubt
                </Link>
                <Link to="/doubts?status=open" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                  <MessageSquare size={14} /> Browse Open Doubts
                </Link>
                <Link to="/leaderboard" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                  <TrendingUp size={14} /> View Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
