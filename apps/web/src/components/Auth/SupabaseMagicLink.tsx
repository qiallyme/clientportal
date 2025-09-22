import React, { useState } from 'react';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import './Auth.css';

const SupabaseMagicLink: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { signInWithMagicLink } = useSupabaseAuth();

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await signInWithMagicLink(email);
      setMessage('Magic link sent! Check your email and click the link to sign in.');
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

export default SupabaseMagicLink;
