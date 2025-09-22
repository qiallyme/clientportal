import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login?error=auth_callback_failed');
          return;
        }

        if (data.session?.user) {
          // Successfully authenticated, redirect to dashboard
          navigate('/dashboard');
        } else {
          // No session, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=auth_callback_failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Authenticating...</h1>
          <p>Please wait while we complete your sign in.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
