import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronUp, CheckCircle, Eye, Clock, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { getDoubt, addAnswer, upvoteDoubt, upvoteAnswer, acceptAnswer, updateDoubtStatus } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function DoubtDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doubt, setDoubt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoubt();
  }, [id]);

  const fetchDoubt = async () => {
  try {
    const res = await getDoubt(id);
    const newDoubt = res.data.doubt;
    
    // Check if AI just answered (was No, now Yes)
    if (doubt && !doubt.aiAnswered && newDoubt.aiAnswered) {
      toast('🤖 SmartDoubt AI has answered your doubt!', {
        duration: 5000,
        style: {
          background: 'rgba(62,207,255,0.15)',
          color: '#3ecfff',
          border: '1px solid rgba(62,207,255,0.3)',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '14px',
        },
        icon: '🤖',
      });
    }

    // Check if new human answer arrived
    if (doubt && newDoubt.answerCount > doubt.answerCount && !newDoubt.aiAnswered) {
      toast.success('💡 Someone answered your doubt!', {
        duration: 4000,
      });
    }

    setDoubt(newDoubt);
  } catch {
    toast.error('Failed to load doubt');
  }
  setLoading(false);
};

  const handleUpvoteDoubt = async () => {
    try {
      const res = await upvoteDoubt(id);
      setDoubt(d => ({
        ...d,
        upvoteCount: res.data.upvoteCount,
        upvotes: res.data.upvoted
          ? [...(d.upvotes || []), user._id]
          : (d.upvotes || []).filter(uid => uid !== user._id)
      }));
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const handleUpvoteAnswer = async (answerId) => {
    try {
      const res = await upvoteAnswer(id, answerId);
      setDoubt(d => ({
        ...d,
        answers: d.answers.map(a => a._id === answerId ? {
          ...a,
          upvoteCount: res.data.upvoteCount,
          upvotes: res.data.upvoted
            ? [...(a.upvotes || []), user._id]
            : (a.upvotes || []).filter(uid => uid !== user._id)
        } : a)
      }));
    } catch {
      toast.error('Failed to upvote answer');
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await acceptAnswer(id, answerId);
      toast.success('Answer accepted! Doubt marked as solved 🎉');
      fetchDoubt();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept answer');
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || answerText.length < 10) {
      return toast.error('Answer must be at least 10 characters');
    }
    setSubmitting(true);
    try {
      await addAnswer(id, { content: answerText, isAnonymous: isAnon });
      toast.success('Answer posted! 🎉');
      setAnswerText('');
      fetchDoubt();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post answer');
    }
    setSubmitting(false);
  };

  const isAuthor = doubt?.author?._id === user?._id || doubt?.author === user?._id;
  const hasUpvotedDoubt = doubt?.upvotes?.includes(user?._id);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!doubt) return <div className="page-container"><p>Doubt not found.</p></div>;

  const sortedAnswers = [...(doubt.answers || [])].sort((a, b) => {
    if (a.isAccepted) return -1;
    if (b.isAccepted) return 1;
    return b.upvoteCount - a.upvoteCount;
  });

  return (
    <div className="page-container">
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="two-col">
        <div>
          {/* Main Doubt Card */}
          <div className="doubt-detail-card">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className={`tag ${doubt.status}`}>{doubt.status}</span>
              <span className="tag subject">{doubt.subject}</span>
              {doubt.tags?.map(t => <span key={t} className="tag">{t}</span>)}
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4, marginBottom: 16 }}>
              {doubt.title}
            </h1>

            <div className="markdown-content" style={{ marginBottom: 24 }}>
              {doubt.content}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  className={`upvote-btn ${hasUpvotedDoubt ? 'active' : ''}`}
                  onClick={handleUpvoteDoubt}
                >
                  <ChevronUp size={16} /> {doubt.upvoteCount} votes
                </button>
                <span className="doubt-stat"><Eye size={14} /> {doubt.views} views</span>
                <span className="doubt-stat"><MessageSquare size={14} /> {doubt.answerCount} answers</span>
              </div>

              <div className="user-info">
                <div className="user-avatar-sm">
                  {doubt.author?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="user-name">{doubt.author?.name || 'Anonymous'}</div>
                  <div className="user-meta">
                    <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                    {formatDistanceToNow(new Date(doubt.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>

            {/* Close Doubt Button — only for author */}
            {isAuthor && doubt.status === 'open' && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={async () => {
                    try {
                      await updateDoubtStatus(id, 'closed');
                      toast.success('Doubt closed');
                      fetchDoubt();
                    } catch {}
                  }}
                >
                  Close Doubt
                </button>
              </div>
            )}
          </div>

          {/* Answers Header */}
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            {sortedAnswers.length} {sortedAnswers.length === 1 ? 'Answer' : 'Answers'}
          </h2>

          {/* No Answers State */}
          {sortedAnswers.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="icon">💭</div>
              <h3>No answers yet</h3>
              <p>Be the first to help!</p>
            </div>
          ) : (

            /* Answer Cards */
            sortedAnswers.map(answer => {
              const hasUpvotedAnswer = answer.upvotes?.includes(user?._id);
              const isAIAnswer = answer.author?.name === 'SmartDoubt AI';

              return (
                <div
                  key={answer._id}
                  className={`answer-card ${answer.isAccepted ? 'accepted' : ''}`}
                  style={isAIAnswer ? {
                    borderColor: 'rgba(62,207,255,0.3)',
                    background: 'rgba(62,207,255,0.03)'
                  } : {}}
                >
                  {/* Accepted Badge */}
                  {answer.isAccepted && (
                    <div style={{ marginBottom: 12 }}>
                      <span className="accepted-badge">
                        <CheckCircle size={14} /> Accepted Answer
                      </span>
                    </div>
                  )}

                  {/* AI Badge */}
                  {isAIAnswer && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(62,207,255,0.1)',
                        color: 'var(--cyan)',
                        border: '1px solid rgba(62,207,255,0.3)',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        🤖 AI Generated Answer — No peer answered within 10 minutes
                      </span>
                    </div>
                  )}

                  {/* Answer Content */}
                  <div className="markdown-content" style={{ marginBottom: 16 }}>
                    {answer.content}
                  </div>

                  {/* Answer Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        className={`upvote-btn ${hasUpvotedAnswer ? 'active' : ''}`}
                        onClick={() => handleUpvoteAnswer(answer._id)}
                      >
                        <ChevronUp size={15} /> {answer.upvoteCount}
                      </button>

                      {/* Accept Button — only for doubt author, non-AI answers */}
                      {isAuthor && !answer.isAccepted && doubt.status !== 'solved' && !isAIAnswer && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--green)', borderColor: 'var(--green)' }}
                          onClick={() => handleAcceptAnswer(answer._id)}
                        >
                          <CheckCircle size={13} /> Accept
                        </button>
                      )}
                    </div>

                    {/* Author Info */}
                    <div className="user-info">
                      <div className="user-avatar-sm" style={isAIAnswer ? {
                        background: 'linear-gradient(135deg, #3ecfff, #6c63ff)',
                        fontSize: 14
                      } : {}}>
                        {isAIAnswer ? '🤖' : answer.author?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="user-name" style={isAIAnswer ? { color: 'var(--cyan)' } : {}}>
                          {answer.author?.name || 'Anonymous'}
                        </div>
                        <div className="user-meta">
                          {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Answer Form */}
          {doubt.status !== 'closed' && (
            <div className="card" style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Your Answer</h3>
              <form onSubmit={handleSubmitAnswer}>
                <div className="form-group">
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Write a clear, helpful answer... (minimum 10 characters)"
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    rows={6}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={isAnon}
                      onChange={e => setIsAnon(e.target.checked)}
                      style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                    />
                    Post anonymously
                  </label>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: 'auto' }}
                    disabled={submitting}
                  >
                    <Send size={14} /> {submitting ? 'Posting...' : 'Post Answer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Closed Notice */}
          {doubt.status === 'closed' && (
            <div style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 20,
              marginTop: 16,
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              🔒 This doubt is closed. No more answers can be added.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="card">
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
              About this doubt
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Status', value: <span className={`tag ${doubt.status}`}>{doubt.status}</span> },
                { label: 'Subject', value: <span className="tag subject">{doubt.subject}</span> },
                { label: 'Priority', value: doubt.priority },
                { label: 'Views', value: doubt.views },
                { label: 'Votes', value: doubt.upvoteCount },
                { label: 'Answers', value: doubt.answerCount },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {doubt.tags?.length > 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Tags
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {doubt.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>
          )}

          {/* AI Answer Notice */}
          {doubt.aiAnswered && (
            <div style={{
              marginTop: 12,
              background: 'rgba(62,207,255,0.05)',
              border: '1px solid rgba(62,207,255,0.2)',
              borderRadius: 12,
              padding: 16
            }}>
              <p style={{ fontSize: 12, color: 'var(--cyan)', margin: 0, lineHeight: 1.6 }}>
                🤖 This doubt was automatically answered by SmartDoubt AI after 10 minutes with no peer response. Human answers are still welcome and encouraged.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}