import { useState, useEffect } from 'react';
import api from '../api';
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

export default function HistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api
      .get('/orders/mine')
      .then((r) => setOrders(r.data.orders))
      .finally(() => setLoading(false));
  }, []);

  const openOrder = async (order) => {
    setSelected(order);
    setDetail(null);
    setDetailLoading(true);
    try {
      const r = await api.get(`/orders/mine/${order.id}`);
      setDetail(r.data.order);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: 'var(--caramel)' }} />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <h3>No orders yet</h3>
          <p>Your order history will appear here after your first purchase.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Order History</h1>
        <p className="page-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      </div>

      <div className="history-list">
        {orders.map((order) => (
          <div className="history-card" key={order.id} onClick={() => openOrder(order)}>
            <div className="history-card-left">
              <div className="history-order-id">Order #{order.id.slice(0, 8)}</div>
              <div className="history-date">{formatDate(order.created_at)}</div>
              <div className="history-addr">{order.customer_name} {order.customer_surname} · {order.delivery_address}</div>
            </div>
            <div className="history-card-right">
              <div className="history-total">{formatPrice(order.total_cents)}</div>
              {order.promo_code && (
                <div className="history-promo">🏷 {order.promo_code}</div>
              )}
              <div className="history-arrow">→</div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.8rem' }}>Order Details</h2>
                <div style={{ color: 'var(--smoke)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  #{selected.id.slice(0, 8)} · {formatDate(selected.created_at)}
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
                {detail.items.map((item) => (
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
