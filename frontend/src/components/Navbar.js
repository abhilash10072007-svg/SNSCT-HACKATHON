import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, LayoutDashboard, MessageSquare, Trophy, User, LogOut, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAllRead } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef();
  const notifRef = useRef();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications);
      setUnread(res.data.unreadCount);
    } catch {}
  };

  const handleMarkRead = async () => {
    try {
      await markAllRead();
      setUnread(0);
      setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className="navbar">
      <NavLink to="/dashboard" className="nav-logo">
        <span className="logo-icon">🎓</span>
        SmartDoubt
      </NavLink>

      <div className="nav-links">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={15} /> Dashboard
        </NavLink>
        <NavLink to="/doubts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <MessageSquare size={15} /> Doubts
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Trophy size={15} /> Leaders
        </NavLink>
      </div>

      <div className="nav-right">
        <button
          className="btn btn-primary btn-sm"
          style={{ width: 'auto', gap: 6 }}
          onClick={() => navigate('/doubts/new')}
        >
          <Plus size={14} /> Ask Doubt
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="notification-btn" onClick={() => { setShowNotifs(!showNotifs); setShowMenu(false); }}>
            <Bell size={18} />
            {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
          </button>

          {showNotifs && (
            <div className="notif-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={handleMarkRead}>Mark all read</button>}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: 13 }}>No notifications yet</p>
                </div>
              ) : notifications.map(n => (
                <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => { if (n.relatedDoubt) navigate(`/doubts/${n.relatedDoubt}`); setShowNotifs(false); }}>
                  {!n.isRead && <div className="notif-dot" />}
                  <div className="notif-content">
                    <p>{n.message}</p>
                    <div className="notif-time">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={menuRef} className="user-menu">
          <button className="user-avatar-btn" onClick={() => { setShowMenu(!showMenu); setShowNotifs(false); }}>
            <div className="user-avatar">{initials}</div>
            <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0]}</span>
            <ChevronDown size={14} />
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
                <div style={{ marginTop: 4 }}><span className="rep-badge">⚡ {user?.reputation || 0} rep</span></div>
              </div>
              <NavLink to="/profile" className="dropdown-item" onClick={() => setShowMenu(false)}>
                <User size={14} /> My Profile
              </NavLink>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
