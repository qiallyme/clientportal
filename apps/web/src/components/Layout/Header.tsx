import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import QiSuiteLogo from '../Branding/QiSuiteLogo';
import './Header.css';

const Header: React.FC = () => {
  const { user, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <QiSuiteLogo size="medium" variant="full" />
          </Link>
        </div>

        <nav className="header-nav">
          {user && (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link to="/forms" className="nav-link">
                Forms
              </Link>
              {user.role === 'admin' && (
                <>
                  <Link to="/submissions" className="nav-link">
                    Submissions
                  </Link>
                  <Link to="/users" className="nav-link">
                    Users
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        <div className="header-right">
          {user ? (
            <div className="user-menu">
              <button
                className="user-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{user.name}</span>
                <span className="user-role">({user.role})</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="dropdown-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Settings
                  </Link>
                  <hr className="dropdown-divider" />
                  <button
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="auth-link">
                Login
              </Link>
              <Link to="/register" className="auth-link register">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
