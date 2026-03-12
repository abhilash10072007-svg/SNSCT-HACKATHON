import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { forgotPassword } from '../utils/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: new password
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPassword({ email });
      toast.success(res.data.message);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    navigate('/verify-otp', { state: { email, type: 'password-reset', newPassword } });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="icon">🔐</div>
          <h1>Smart Doubt Exchange</h1>
          <p>Reset your password</p>
        </div>

        {step === 1 ? (
          <>
            <h2 className="auth-title">Forgot your password?</h2>
            <p className="auth-subtitle">Enter your email and we'll send you a reset code</p>
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send Reset Code →'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="auth-title">Set new password</h2>
            <p className="auth-subtitle">Choose a strong new password for your account</p>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    className="form-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Continue to Verify →
              </button>
            </form>
          </>
        )}

        <div className="auth-footer">
          <Link to="/login" className="auth-link">← Back to login</Link>
        </div>
      </div>
    </div>
  );
}
