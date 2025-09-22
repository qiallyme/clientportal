import React, { useState } from 'react';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import QiSuiteLogo from '../Branding/QiSuiteLogo';
import './Auth.css';

const EnterpriseMagicLink: React.FC = () => {
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
    <div className="auth-container enterprise">
      <div className="auth-card">
        {/* Left Panel - Magic Link Form */}
        <div className="auth-left-panel">
          <div className="auth-form-container">
            <div className="auth-header">
              <QiSuiteLogo size="large" variant="full" className="mb-8" />
              <h1>Magic Link Sign In</h1>
              <p>Enter your email to receive a secure sign-in link</p>
            </div>

            <form onSubmit={handleRequestMagicLink} className="auth-form">
              {message && <div className={`message ${message.includes('Error') ? 'error-message' : 'success-message'}`}>{message}</div>}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
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
                  Back to regular sign in
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Branding */}
        <div className="auth-right-panel">
          <div className="auth-branding-container">
            <h1>Passwordless Authentication</h1>
            <p>
              Experience the future of secure authentication. No passwords to remember, 
              no security risks. Just click the link in your email and you're in.
            </p>
            
            <div className="auth-features">
              <div className="auth-feature">
                <svg className="auth-feature-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="auth-feature-text">Enhanced security</span>
              </div>
              
              <div className="auth-feature">
                <svg className="auth-feature-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="auth-feature-text">One-click access</span>
              </div>
              
              <div className="auth-feature">
                <svg className="auth-feature-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="auth-feature-text">No password management</span>
              </div>
              
              <div className="auth-feature">
                <svg className="auth-feature-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="auth-feature-text">Enterprise approved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseMagicLink;
