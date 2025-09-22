import React from 'react';
import { Link } from 'react-router-dom';
import QiSuiteLogo from '../Branding/QiSuiteLogo';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <QiSuiteLogo size="large" variant="full" className="hero-logo" />
            <h1 className="hero-title">QiAlly Portal</h1>
            <p className="hero-subtitle">
              Streamline your workflow with our enterprise-grade client portal. 
              Manage forms, track submissions, and collaborate seamlessly.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary">
                Sign In
              </Link>
              <Link to="/magic-link" className="btn btn-secondary">
                Magic Link Login
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-graphic">
              <div className="floating-card card-1">
                <div className="card-icon">📋</div>
                <div className="card-text">Forms</div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">📊</div>
                <div className="card-text">Analytics</div>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon">👥</div>
                <div className="card-text">Collaboration</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose QiAlly Portal?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Enterprise Security</h3>
              <p>Bank-level security with end-to-end encryption and compliance standards.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-time Collaboration</h3>
              <p>Work together seamlessly with live updates and instant notifications.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Advanced Analytics</h3>
              <p>Gain insights with comprehensive reporting and data visualization.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Custom Workflows</h3>
              <p>Tailor the platform to your specific business processes and requirements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of organizations already using QiAlly Portal</p>
            <Link to="/login" className="btn btn-primary btn-large">
              Access Your Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <QiSuiteLogo size="medium" variant="full" />
            <p>&copy; 2024 QiAlly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
