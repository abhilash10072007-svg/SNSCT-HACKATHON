import { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(res => setLeaders(res.data.leaders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">🏆 Leaderboard</h1>
        <p className="page-subtitle">Top contributors ranked by reputation points</p>
      </div>

      <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--accent-light)' }}>How reputation works:</strong> +2 for doubt upvote · +5 for posting answer · +3 for answer upvote · +15 for accepted answer
      </div>

      {leaders.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🌟</div>
          <h3>No leaders yet</h3>
          <p>Start answering doubts to earn reputation!</p>
        </div>
      ) : leaders.map((leader, i) => {
        const isMe = leader._id === user?._id;
        const rank = i + 1;
        return (
          <div key={leader._id} className="leaderboard-row" style={isMe ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)' } : {}}>
            <div className={`leaderboard-rank rank-${rank <= 3 ? rank : 'other'}`}>
              {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
            </div>

            <div className="user-avatar-sm" style={{ width: 40, height: 40, fontSize: 15, borderRadius: 10 }}>
              {leader.name[0]?.toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{leader.name}</span>
                {isMe && <span className="tag" style={{ fontSize: 11 }}>You</span>}
                <span className="tag" style={{ fontSize: 11 }}>{leader.role}</span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>💬 {leader.doubtsAsked} doubts</span>
                <span>📝 {leader.answersGiven} answers</span>
                {leader.badges?.length > 0 && <span>🏅 {leader.badges.length} badges</span>}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: rank === 1 ? 'var(--yellow)' : rank === 2 ? '#9ca3af' : rank === 3 ? '#cd7c2f' : 'var(--accent-light)' }}>
                {leader.reputation}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>rep</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
