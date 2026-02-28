import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Contact.css';

export default function ContactPage() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.email?.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? '',
    email: user?.email ?? '',
    subject: '',
    body: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.body.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/contact', form);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="page">
        <div className="contact-sent">
          <div className="contact-sent-icon">✉️</div>
          <h2>Message Sent!</h2>
          <p>Thanks for reaching out. We'll get back to you as soon as possible.</p>
          <button className="btn btn-primary" onClick={() => { setSent(false); setForm(f => ({ ...f, subject: '', body: '' })); }}>
            Send Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Contact Us</h1>
        <p className="page-subtitle">Got a question or feedback? We'd love to hear from you.</p>
      </div>

      <div className="contact-layout">
        <div className="contact-form card">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              className="form-input"
              value={form.subject}
              onChange={e => set('subject', e.target.value)}
              placeholder="Question about my order"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Message <span className="char-count">{form.body.length}/2000</span>
            </label>
            <textarea
              className="form-input contact-textarea"
              value={form.body}
              onChange={e => set('body', e.target.value.slice(0, 2000))}
              placeholder="Write your message here..."
              rows={7}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Send Message'}
            </button>
          </div>
        </div>

        <div className="contact-info">
          <div className="contact-info-card card">
            <h3>Get in Touch</h3>
            <ul className="contact-info-list">
              <li>
                <span className="contact-info-icon">📧</span>
                <div>
                  <div className="contact-info-label">Email</div>
                  <div>support@beanandbrew.com</div>
                </div>
              </li>
              <li>
                <span className="contact-info-icon">📞</span>
                <div>
                  <div className="contact-info-label">Phone</div>
                  <div>+351 210 123 456</div>
                </div>
              </li>
              <li>
                <span className="contact-info-icon">🕐</span>
                <div>
                  <div className="contact-info-label">Hours</div>
                  <div>Mon–Fri, 9:00–18:00 (WET)</div>
                </div>
              </li>
              <li>
                <span className="contact-info-icon">📍</span>
                <div>
                  <div className="contact-info-label">Address</div>
                  <div>Rua do Cafe 42, 1200-001<br />Lisbon, Portugal</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
