import { useState, useEffect } from 'react';
import api from '../api';
import './Admin.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [replyError, setReplyError] = useState('');

  useEffect(() => {
    api.get('/contact/admin')
      .then(r => setMessages(r.data.messages))
      .finally(() => setLoading(false));
  }, []);

  const openMessage = async (msg) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    setReply('');
    setReplyError('');
    try {
      const r = await api.get(`/contact/admin/${msg.id}`);
      setSelected(r.data.message);
    } catch {
      setSelected(msg);
    }
  };

  const submitReply = async () => {
    setReplyError('');
    if (!reply.trim()) { setReplyError('Reply cannot be empty.'); return; }
    setSaving(true);
    try {
      const r = await api.put(`/contact/admin/${selected.id}/reply`, { reply });
      const updated = r.data.message;
      setSelected(updated);
      setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, replied_at: updated.replied_at, is_read: true } : m));
      setReply('');
    } catch (err) {
      setReplyError(err.response?.data?.error || 'Failed to save reply.');
    } finally {
      setSaving(false);
    }
  };

  const unread = messages.filter(m => !m.is_read).length;

  const markAllRead = () => {
    api.patch('/contact/admin/mark-all-read').catch(() => {});
    setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
    window.dispatchEvent(new CustomEvent('admin-messages-read'));
  };

  return (
    <div className="page">
      <div className="admin-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">
            {messages.length} total{unread > 0 && <> · <span style={{ color: 'var(--caramel)', fontWeight: 600 }}>{unread} unread</span></>}
          </p>
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: 'var(--caramel)' }} />
        </div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✉️</div>
          <h3>No messages yet</h3>
          <p>Contact form submissions will appear here.</p>
        </div>
      ) : (
        <div className="msg-list card">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`msg-row${!msg.is_read ? ' msg-unread' : ''}`}
              onClick={() => openMessage(msg)}
            >
              <div className="msg-dot-wrap">
                {!msg.is_read && <span className="msg-dot" />}
              </div>
              <div className="msg-from">
                <span className="msg-name">{msg.name}</span>
                <span className="msg-email">{msg.email}</span>
              </div>
              <div className="msg-subject">{msg.subject}</div>
              <div className="msg-meta">
                {msg.replied_at && <span className="msg-badge msg-badge-replied">Replied</span>}
                <span className="msg-date">{formatDate(msg.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box msg-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.6rem' }}>{selected.subject}</h2>
                <div style={{ color: 'var(--smoke)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  From: <strong>{selected.name}</strong> &lt;{selected.email}&gt; · {formatDate(selected.created_at)}
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="msg-body-box">{selected.body}</div>

            <hr className="divider" />

            {selected.reply && (
              <div className="msg-existing-reply">
                <div className="msg-existing-reply-label">Your reply · {formatDate(selected.replied_at)}</div>
                <p>{selected.reply}</p>
              </div>
            )}

            <div className="form-group" style={{ marginTop: selected.reply ? '1rem' : 0 }}>
              <label className="form-label">{selected.reply ? 'Update Reply' : 'Write a Reply'}</label>
              <textarea
                className="form-input msg-reply-textarea"
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder={`Reply to ${selected.name}...`}
                rows={4}
              />
            </div>
            {replyError && <div className="alert alert-error">{replyError}</div>}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
              <button className="btn btn-primary" onClick={submitReply} disabled={saving}>
                {saving ? <span className="spinner" /> : selected.reply ? 'Update Reply' : 'Save Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
