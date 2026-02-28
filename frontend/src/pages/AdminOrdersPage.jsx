import { useState, useEffect } from 'react';
import api from '../api';
import './Admin.css';
import './History.css';

function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api.get('/orders/admin')
      .then(r => setOrders(r.data.orders))
      .finally(() => setLoading(false));
  }, []);

  const openOrder = async (order) => {
    setSelected(order);
    setDetail(null);
    setDetailLoading(true);
    try {
      const r = await api.get(`/orders/admin/${order.id}`);
      setDetail(r.data.order);
      // Mark row as read locally so the dot disappears immediately
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, is_read: true } : o));
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalIncome = orders.reduce((sum, o) => sum + o.total_cents, 0);

  return (
    <div className="page">
      <div className="admin-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">
            {orders.length} order{orders.length !== 1 ? 's' : ''} total
            {orders.length > 0 && (
              <> · Total income: <strong style={{ color: 'var(--caramel)' }}>{formatPrice(totalIncome)}</strong></>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: 'var(--caramel)' }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h3>No orders yet</h3>
          <p>Orders placed by customers will appear here.</p>
        </div>
      ) : (
        <div className="msg-list card">
          {orders.map(order => (
              <div key={order.id} className={`msg-row${!order.is_read ? ' msg-unread' : ''}`} onClick={() => openOrder(order)}>
                <div className="msg-dot-wrap">
                  {!order.is_read && <span className="msg-dot" />}
                </div>
                <div className="msg-from">
                  <span className="msg-name">{order.customer_name} {order.customer_surname}</span>
                  {order.is_guest
                    ? <span className="msg-badge" style={{ fontSize: '0.75rem' }}>Guest</span>
                    : <span className="msg-email">{order.user_email}</span>
                  }
                </div>
                <div className="msg-subject" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {order.payment_method === 'card' ? '💳 Card' : '💵 Cash'}
                  {order.promo_code && <span className="msg-badge msg-badge-replied">Promo</span>}
                </div>
                <div className="msg-meta">
                  <span style={{ fontWeight: 600, color: 'var(--espresso)' }}>{formatPrice(order.total_cents)}</span>
                  <span className="msg-date">{formatDate(order.created_at)}</span>
                </div>
              </div>
          ))}
        </div>
      )}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.8rem' }}>Order Details</h2>
                <div style={{ color: 'var(--smoke)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  #{selected.id.slice(0, 8)} · {selected.is_guest ? 'Guest' : selected.user_email} · {formatDate(selected.created_at)}
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            {detailLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <span className="spinner" style={{ color: 'var(--caramel)', width: 28, height: 28 }} />
              </div>
            ) : detail ? (
              <>
                <h4 style={{ marginBottom: '0.75rem' }}>Items</h4>
                {detail.items.map(item => (
                  <div className="detail-item" key={item.id}>
                    <div className="detail-item-info">
                      <span>{item.product_name_snapshot}</span>
                      <span className="detail-weight">{item.weight_grams_snapshot}g</span>
                    </div>
                    <div className="detail-item-right">
                      <span style={{ color: 'var(--smoke)' }}>× {item.quantity}</span>
                      <span style={{ fontWeight: 600 }}>{formatPrice(item.unit_price_cents_snapshot * item.quantity)}</span>
                    </div>
                  </div>
                ))}

                <hr className="divider" />
                <div className="detail-totals">
                  <div className="detail-total-row">
                    <span>Subtotal</span><span>{formatPrice(detail.subtotal_cents)}</span>
                  </div>
                  {detail.discount_cents > 0 && (
                    <div className="detail-total-row" style={{ color: 'var(--green)' }}>
                      <span>Promo ({detail.promo_code})</span>
                      <span>−{formatPrice(detail.discount_cents)}</span>
                    </div>
                  )}
                  <div className="detail-total-row detail-grand-total">
                    <span>Total</span>
                    <span className="price">{formatPrice(detail.total_cents)}</span>
                  </div>
                </div>

                <hr className="divider" />
                <h4 style={{ marginBottom: '0.6rem' }}>Delivery</h4>
                <div className="detail-delivery">
                  <div>{detail.customer_name} {detail.customer_surname}</div>
                  <div>{detail.delivery_address}</div>
                  <div>{detail.phone}</div>
                  <div style={{ marginTop: '0.4rem', color: 'var(--smoke)', fontSize: '0.875rem' }}>
                    {detail.payment_method === 'card' ? '💳 Paid by Card' : '🚚 Pay on Delivery'}
                  </div>
                </div>
              </>
            ) : (
              <div className="alert alert-error">Could not load order details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
