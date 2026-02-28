import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useBag } from '../context/BagContext';
import './Bag.css';

function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

export default function BagPage() {
  const { items, updateQty, removeItem } = useBag();
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/products')
      .then((r) => {
        const map = {};
        for (const p of r.data.products) map[p.id] = p;
        setProducts(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const subtotal = items.reduce((sum, item) => {
    const p = products[item.productId];
    return sum + (p ? p.price_cents * item.quantity : 0);
  }, 0);

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: 'var(--caramel)' }} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything yet. Let's fix that!</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/shop')}>
            Browse the Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Your Bag</h1>
        <p className="page-subtitle">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bag-layout">
        <div className="bag-items">
          {items.map((item) => {
            const p = products[item.productId];
            if (!p) return null;
            return (
              <div className="bag-item" key={item.productId}>
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="bag-item-img"
                  onError={(e) =>
                    (e.target.src =
                      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&q=80')
                  }
                />
                <div className="bag-item-info">
                  <div className="bag-item-name">{p.name}</div>
                  <div className="bag-item-sub">{p.weight_grams}g — {formatPrice(p.price_cents)} each</div>
                </div>
                <div className="qty-selector">
                  <button className="qty-btn" onClick={() => updateQty(item.productId, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                  <span className="qty-num">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.productId, item.quantity + 1)} disabled={item.quantity >= p.quantity}>+</button>
                </div>
                <div className="bag-item-price">{formatPrice(p.price_cents * item.quantity)}</div>
                <button className="btn btn-ghost btn-sm bag-remove" onClick={() => removeItem(item.productId)}>✕</button>
              </div>
            );
          })}
        </div>

        <div className="bag-summary card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.4rem' }}>Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span><span style={{ color: 'var(--green)' }}>Free</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span><span className="price">{formatPrice(subtotal)}</span>
          </div>
          <button
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: '1.25rem' }}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout →
          </button>
          <button className="btn btn-ghost btn-full" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/shop')}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
