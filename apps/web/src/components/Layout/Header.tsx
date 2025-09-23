import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import QiSuiteLogo from '../Branding/QiSuiteLogo';
import './Header.css';

const Header: React.FC = () => {
  const {
    user,
    signOut,
    notifications,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    tenant,
    checkPermission
  } = useSupabaseAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
              <Link to="/chat" className="nav-link">
                Chat
              </Link>
              <Link to="/tasks" className="nav-link">
                Tasks
              </Link>
              {(user?.role === 'super_admin' || user?.role === 'tenant_admin' || checkPermission('view:submissions')) && (
                <Link to="/submissions" className="nav-link">
                  Submissions
                </Link>
              )}
              {(user?.role === 'super_admin' || checkPermission('manage:users')) && (
                <Link to="/users" className="nav-link">
                  Users
                </Link>
              )}
              {user?.role === 'super_admin' && (
                <Link to="/tenants" className="nav-link">
                  Tenants
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="header-right">
          {user ? (
            <>
              {/* Notifications */}
              <div className="notifications-menu">
                <button
                  className="notifications-button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      fetchNotifications();
                    }
                  }}
                >
                  <svg className="notifications-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications?.unreadCount > 0 && (
                    <span className="notification-badge">{notifications.unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notifications-dropdown">
                    <div className="notifications-header">
                      <h3>Notifications</h3>
                      {notifications?.unreadCount > 0 && (
                        <button
                          className="mark-all-read"
                          onClick={() => {
                            markAllNotificationsRead();
                            setShowNotifications(false);
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notifications-list">
                      {notifications?.loading ? (
                        <div className="loading">Loading...</div>
                      ) : notifications?.notifications.length === 0 ? (
                        <div className="no-notifications">No notifications</div>
                      ) : (
                        notifications?.notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            className={`notification-item ${!notification.read ? 'unread' : ''}`}
                            onClick={() => {
                              if (!notification.read) {
                                markNotificationRead(notification.id);
                              }
                              if (notification.actionUrl) {
                                navigate(notification.actionUrl);
                                setShowNotifications(false);
                              }
                            }}
                          >
                            <div className="notification-content">
                              <div className="notification-title">{notification.title}</div>
                              <div className="notification-message">{notification.message}</div>
                              <div className="notification-time">
                                {new Date(notification.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                            {!notification.read && <div className="unread-dot"></div>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="user-menu">
                <button
                  className="user-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user.name || user.email}</span>
                    <span className="user-role">({user.role || 'user'})</span>
                    {tenant && (
                      <span className="user-tenant">{tenant.name}</span>
                    )}
                  </div>
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
            </>
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
