import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail, resetPassword, resendOTP } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function VerifyOTP() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { email, type = 'email-verify', newPassword } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    if (!email) { navigate('/register'); return; }
    inputs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) return toast.error('Please enter the 6-digit OTP');

    setLoading(true);
    try {
      if (type === 'password-reset') {
        const res = await resetPassword({ email, otp: otpStr, newPassword });
        toast.success(res.data.message);
        navigate('/login');
      } else {
        const res = await verifyEmail({ email, otp: otpStr });
        toast.success(res.data.message);
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await resendOTP({ email, type });
      toast.success(res.data.message);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const otpFilled = otp.join('').length;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="icon">📨</div>
          <h1>Smart Doubt Exchange</h1>
          <p>Email Verification</p>
        </div>

        <h2 className="auth-title">Check your inbox</h2>
        <p className="auth-subtitle">
          We sent a 6-digit code to <strong style={{ color: 'var(--accent-light)' }}>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                className={`otp-input ${digit ? 'filled' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
              />
            ))}
          </div>

          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 16px', display: 'inline-block' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                ⏱ Code expires in <strong style={{ color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>10:00</strong>
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || otpFilled < 6}
          >
            {loading ? 'Verifying...' : `Verify Code ${otpFilled}/6`}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: 20 }}>
          Didn't receive the code?{' '}
          {countdown > 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>Resend in {countdown}s</span>
          ) : (
            <button
              className="auth-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(type === 'password-reset' ? '/forgot-password' : '/register')}
          >
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}
