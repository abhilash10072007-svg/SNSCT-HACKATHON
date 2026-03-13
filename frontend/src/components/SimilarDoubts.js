import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ExternalLink, CheckCircle, MessageSquare, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import API from '../utils/api';

const DEBOUNCE_MS = 700;
const MIN_TITLE = 8;

export default function SimilarDoubts({ title = '', content = '', subject = '' }) {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [queried, setQueried] = useState('');
  const timerRef = useRef(null);
  const queriedRef = useRef('');

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (title.trim().length < MIN_TITLE) {
      setSimilar([]);
      setQueried('');
      queriedRef.current = '';
      return;
    }

    if (title.trim() === queriedRef.current) return;

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await API.post('/similar', { title, content, subject });
        setSimilar(res.data.similar || []);
        setQueried(title.trim());
        queriedRef.current = title.trim();
      } catch {
        setSimilar([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [title, content, subject]);

  if (!loading && similar.length === 0 && title.trim().length < MIN_TITLE) return null;

  const scoreToLabel = (score) => {
    if (score >= 0.65) return { text: 'Very similar', color: 'var(--red)' };
    if (score >= 0.45) return { text: 'Similar', color: 'var(--yellow)' };
    return { text: 'Related', color: 'var(--accent-light)' };
  };

  return (
    <div style={{
      border: '1px solid rgba(108,99,255,0.35)',
      borderRadius: 12,
      background: 'rgba(108,99,255,0.06)',
      overflow: 'hidden',
      marginBottom: 20,
      transition: 'all 0.2s ease',
    }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', cursor: 'pointer',
          borderBottom: expanded ? '1px solid rgba(108,99,255,0.2)' : 'none',
        }}
      >
        <Sparkles size={15} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent-light)', flex: 1 }}>
          {loading
            ? 'Checking for similar doubts…'
            : similar.length > 0
              ? `${similar.length} similar doubt${similar.length > 1 ? 's' : ''} found — check before posting!`
              : 'No similar doubts found ✓'
          }
        </span>
        {loading
          ? <Loader size={14} style={{ color: 'var(--accent-light)', animation: 'spin 0.8s linear infinite' }} />
          : expanded
            ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} />
            : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
        }
      </div>

      {expanded && !loading && similar.length > 0 && (
        <div style={{ padding: '8px 0' }}>
          {similar.map((d, i) => {
            const { text: matchLabel, color: matchColor } = scoreToLabel(d.score);
            return (
              <Link
                key={d._id}
                to={`/doubts/${d._id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 16px', textDecoration: 'none', color: 'inherit',
                  borderBottom: i < similar.length - 1 ? '1px solid rgba(108,99,255,0.12)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, paddingTop: 2 }}>
                  <div style={{
                    width: 4, height: 36, borderRadius: 4,
                    background: `linear-gradient(to bottom, ${matchColor}, ${matchColor}55)`,
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                    }}>
                      {d.title}
                    </span>
                    <ExternalLink size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {d.subject && (
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: 'var(--cyan-dim)', color: 'var(--cyan)',
                        border: '1px solid rgba(62,207,255,0.2)',
                      }}>
                        {d.subject}
                      </span>
                    )}
                    {d.status === 'solved' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--green)' }}>
                        <CheckCircle size={11} /> Solved
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.status}</span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                      <MessageSquare size={11} /> {d.answerCount} answer{d.answerCount !== 1 ? 's' : ''}
                    </span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                      color: matchColor,
                      background: `${matchColor}18`,
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      {matchLabel}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
          <div style={{ padding: '10px 16px 4px', fontSize: 12, color: 'var(--text-muted)' }}>
            💡 Check if your question is already answered before posting to keep the community clean.
          </div>
        </div>
      )}

      {expanded && !loading && similar.length === 0 && queried && (
        <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
          🎉 Looks like this is a fresh question — go ahead and post it!
        </div>
      )}
    </div>
  );
}