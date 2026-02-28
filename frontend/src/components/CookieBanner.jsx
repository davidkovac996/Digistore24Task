import { useState, useEffect } from 'react';
import './CookieBanner.css';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('bb_cookie_consent');
    if (!consent) {
      // Small delay so it slides in after page loads
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('bb_cookie_consent', 'all');
    setVisible(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem('bb_cookie_consent', 'necessary');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={`cookie-banner ${visible ? 'cookie-banner--visible' : ''}`}>
      <div className="cookie-banner-inner">
        <div className="cookie-icon">🍪</div>
        <div className="cookie-text">
          <h4>We use cookies</h4>
          <p>
            Bean &amp; Brew uses cookies to enhance your browsing experience, remember your bag,
            and analyze site traffic. By clicking "Accept All" you consent to our use of cookies.{' '}
            <a href="#" className="cookie-link" onClick={(e) => e.preventDefault()}>
              Learn more
            </a>
          </p>
        </div>
        <div className="cookie-actions">
          <button className="btn btn-ghost btn-sm" onClick={acceptNecessary}>
            Necessary Only
          </button>
          <button className="btn btn-primary btn-sm" onClick={acceptAll}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
