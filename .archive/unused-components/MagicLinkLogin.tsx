import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const MagicLinkLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [magicToken, setMagicToken] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);

  const { requestMagicLink, verifyMagicLink } = useAuth();

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await requestMagicLink(email);
      setMagicToken(result.magicToken || null);
      setExpiresIn(result.expiresIn);
      setMessage('Magic link sent! Check your email or use the token below for testing.');
    } catch (error: any) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMagicLink = async () => {
    if (!magicToken) return;
    
    setLoading(true);
    setMessage('');

    try {
      await verifyMagicLink(magicToken);
      setMessage('Login successful! Redirecting...');
    } catch (error: any) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Magic Link Login</h1>
          <p>Enter your email to receive a magic link</p>
        </div>

        <form onSubmit={handleRequestMagicLink} className="auth-form">
          {message && <div className={`message ${message.includes('Error') ? 'error-message' : 'success-message'}`}>{message}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {magicToken && (
          <div className="magic-link-section">
            <h3>Testing Mode - Magic Token</h3>
            <p>For testing purposes, here's your magic token:</p>
            <div className="token-display">
              <code>{magicToken}</code>
            </div>
            <p>Expires in: {Math.floor(expiresIn / 60)} minutes</p>
            <button
              onClick={handleVerifyMagicLink}
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Magic Link'}
            </button>
          </div>
        )}

        <div className="auth-footer">
          <p>
            <a href="/login" className="auth-link">
              Back to regular login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MagicLinkLogin;
