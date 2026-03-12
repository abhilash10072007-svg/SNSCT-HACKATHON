import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, TrendingUp, Clock, Search, Plus, Filter } from 'lucide-react';
import { getDoubts, getSubjects } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Other'];

export default function DoubtList() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({ subject: '', status: '', sort: '-createdAt', search: '' });
  const [page, setPage] = useState(1);

  const fetchDoubts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await getDoubts(params);
      setDoubts(res.data.doubts);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { fetchDoubts(); }, [fetchDoubts]);

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Doubt Exchange</h1>
          <p className="page-subtitle">{pagination.total} doubts — find answers or share what you know</p>
        </div>
        <Link to="/doubts/new" className="btn btn-primary" style={{ width: 'auto' }}>
          <Plus size={15} /> Ask a Doubt
        </Link>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search doubts..."
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
          />
        </div>

        <select className="filter-select" value={filters.subject} onChange={e => handleFilterChange('subject', e.target.value)}>
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="filter-select" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="solved">Solved</option>
          <option value="closed">Closed</option>
        </select>

        <select className="filter-select" value={filters.sort} onChange={e => handleFilterChange('sort', e.target.value)}>
          <option value="-createdAt">Newest</option>
          <option value="-upvoteCount">Most Voted</option>
          <option value="-views">Most Viewed</option>
          <option value="-answerCount">Most Answered</option>
          <option value="createdAt">Oldest</option>
        </select>
      </div>

      {/* Doubt list */}
      {loading ? (
        <div className="loading-screen" style={{ height: 300 }}>
          <div className="spinner" />
        </div>
      ) : doubts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h3>No doubts found</h3>
          <p>Try different filters or be the first to ask!</p>
          <Link to="/doubts/new" className="btn btn-primary" style={{ width: 'auto', marginTop: 16 }}>Ask a Doubt</Link>
        </div>
      ) : (
        <>
          {doubts.map(d => (
            <Link key={d._id} to={`/doubts/${d._id}`} className="doubt-card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Votes/answers column */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 60 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: d.upvoteCount > 0 ? 'var(--accent-light)' : 'var(--text-muted)' }}>{d.upvoteCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>votes</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: 18, fontWeight: 700,
                      color: d.status === 'solved' ? 'var(--green)' : d.answerCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                      border: d.status === 'solved' ? '2px solid var(--green)' : '2px solid transparent',
                      borderRadius: 6, padding: '2px 6px'
                    }}>{d.answerCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>answers</div>
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 className="doubt-title" style={{ marginBottom: 0, flex: 1 }}>{d.title}</h3>
                    <span className={`tag ${d.status}`}>{d.status}</span>
                    {d.priority === 'urgent' && <span className="tag urgent">🔴 urgent</span>}
                  </div>
                  <p className="doubt-excerpt">{d.content}</p>
                  <div className="doubt-meta">
                    <span className="tag subject">{d.subject}</span>
                    {d.tags?.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      {d.author?.name && (
                        <>
                          <div className="user-avatar-sm" style={{ width: 20, height: 20, fontSize: 9 }}>
                            {d.author.name[0]?.toUpperCase()}
                          </div>
                          <span>{d.author.name}</span> ·
                        </>
                      )}
                      <Clock size={12} /> {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
                Page {page} of {pagination.pages}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
