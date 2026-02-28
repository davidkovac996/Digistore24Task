import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './Admin.css';
import './MyMessages.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MyMessagesPage() {
  const { user } = useAuth();
  const storageKey = `seenReplyIds_${user.id}`;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  // IDs of messages that had unread replies at the moment this page loaded
  const [newReplyIds, setNewReplyIds] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/contact/mine').then(r => {
      const fetched = r.data.messages;
      setMessages(fetched);
      // Only read localStorage here — never write on mount (avoids React StrictMode double-invoke bug)
      const seen = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
      setNewReplyIds(new Set(fetched.filter(m => m.reply && !seen.has(m.id)).map(m => m.id)));
    }).finally(() => setLoading(false));
  }, []);

  const openMessage = (msg) => {
    setOpen(msg);
    if (newReplyIds.has(msg.id)) {
      // Mark as seen in localStorage only when the user actually opens the message
      const seen = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
      seen.add(msg.id);
      localStorage.setItem(storageKey, JSON.stringify([...seen]));
      const updated = new Set(newReplyIds);
      updated.delete(msg.id);
      setNewReplyIds(updated);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: 'var(--caramel)' }} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Messages</h1>
        <p className="page-subtitle">{messages.length} message{messages.length !== 1 ? 's' : ''} sent</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        <button className="btn btn-primary" onClick={() => navigate('/contact')}>
          + New Message
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✉️</div>
          <h3>No messages yet</h3>
          <p>Send us a message and we'll get back to you.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/contact')}>
            Contact Us
          </button>
        </div>
      ) : (
        <div className="msg-list msg-list-client card">
          {messages.map(msg => {
            const hasUnreadReply = newReplyIds.has(msg.id);
            return (
              <div
                key={msg.id}
                className={`msg-row${hasUnreadReply ? ' msg-unread' : ''}`}
                onClick={() => openMessage(msg)}
              >
                <div className="msg-dot-wrap">
                  {hasUnreadReply && <span className="msg-dot" />}
                </div>
                <div className="msg-from">
                  <span className="msg-name">{msg.subject}</span>
                  <span className="msg-email">{msg.body.slice(0, 80)}{msg.body.length > 80 ? '…' : ''}</span>
                </div>
                <div className="msg-meta">
                  {msg.reply
                    ? <span className="msg-badge msg-badge-replied">Replied</span>
                    : <span className="msg-badge msg-badge-pending">Awaiting reply</span>
                  }
                  <span className="msg-date">{formatDate(msg.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(null)}>
          <div className="modal-box mymsg-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.6rem' }}>{open.subject}</h2>
                <div style={{ color: 'var(--smoke)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Sent {formatDate(open.created_at)}
                </div>
              </div>
              <button className="modal-close" onClick={() => setOpen(null)}>✕</button>
            </div>

            <div className="mymsg-thread">
              {/* User's original message */}
              <div className="mymsg-bubble mymsg-bubble-sent">
                <div className="mymsg-bubble-label">You</div>
                <p>{open.body}</p>
              </div>

              {/* Admin reply or awaiting */}
              {open.reply ? (
                <div className="mymsg-bubble mymsg-bubble-reply">
                  <div className="mymsg-bubble-label">Bean &amp; Brew · {formatDate(open.replied_at)}</div>
                  <p>{open.reply}</p>
                </div>
              ) : (
                <div className="mymsg-awaiting">
                  <span className="mymsg-awaiting-dot" />
                  We haven't replied yet — we'll get back to you soon.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setOpen(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
