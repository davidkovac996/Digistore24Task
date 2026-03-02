import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useBag } from '../context/BagContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

const PROMO = 'digistore24';

function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

function validateCard(card) {
  const num = card.number.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(num)) return 'Enter a valid card number.';
  if (!card.name.trim()) return 'Enter the name on card.';
  const expMatch = card.expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!expMatch) return 'Enter expiry as MM/YY.';
  const month = parseInt(expMatch[1], 10);
  const year = 2000 + parseInt(expMatch[2], 10);
  if (month < 1 || month > 12) return 'Invalid expiry month.';
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    return 'Card has expired.';
  }
  if (!/^\d{3,4}$/.test(card.cvv)) return 'Enter a valid CVV (3-4 digits).';
  return null;
}

export default function CheckoutPage() {
  const { items, clearBag, addItem } = useBag();
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customer_name: '',
    customer_surname: '',
    delivery_address: '',
    phone: '',
  });
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });

  useEffect(() => {
    api.get('/products').then((r) => {
      const map = {};
      for (const p of r.data.products) map[p.id] = p;
      setProducts(map);
    });
  }, []);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const setCardField = (k, v) => setCard((prev) => ({ ...prev, [k]: v }));

  const applyPromo = () => {
    setPromoError('');
    if (promo.trim().toLowerCase() === PROMO) {
      setPromoApplied(true);
    } else {
      setPromoError('Invalid promo code. Try DIGISTORE24.');
    }
  };

  const cartProductIds = new Set(items.map((i) => i.productId));
  const suggestedProduct = Object.values(products).find(
    (p) => !cartProductIds.has(p.id) && p.quantity > 0
  ) || null;

  const subtotal = items.reduce((sum, item) => {
    const p = products[item.productId];
    return sum + (p ? p.price_cents * item.quantity : 0);
  }, 0);
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  const placeOrder = async () => {
    setError('');
    const { customer_name, customer_surname, delivery_address, phone } = form;
    if (!customer_name || !customer_surname || !delivery_address || !phone) {
      setError('Please fill in all delivery fields.');
      return;
    }
    if (paymentMethod === 'card') {
      const cardError = validateCard(card);
      if (cardError) { setError(cardError); return; }
    }
    setLoading(true);
    try {
      const endpoint = isGuest ? '/orders/guest' : '/orders';
      await api.post(endpoint, {
        items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        customer_name,
        customer_surname,
        delivery_address,
        phone,
        promo_code: promoApplied ? PROMO : undefined,
        payment_method: paymentMethod,
      });
      clearBag();
      if (isGuest) {
        setOrderSuccess(true);
      } else {
        navigate('/history');
      }
    } catch (err) {
      if (err.response?.status === 409) {
        const insuf = err.response.data.insufficient || [];
        const names = insuf.map((i) => i.name || i.product_id).join(', ');
        setError(`Some items are out of stock: ${names}. Please update your bag.`);
      } else {
        setError(err.response?.data?.error || 'Order failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>Order placed!</h3>
          <p>Thank you for your order. We'll get it ready for you soon.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/shop')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <h3>Nothing to checkout</h3>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/shop')}>
            Go Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Checkout</h1>
        <p className="page-subtitle">Almost there — fill in your details below.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {suggestedProduct && (
        <div className="recommendation-card card">
          <div className="recommendation-tag">☕ Before you check out…</div>
          <div className="recommendation-body">
            <img
              src={suggestedProduct.image_url}
              alt={suggestedProduct.name}
              className="recommendation-img"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&q=80'; }}
            />
            <div className="recommendation-info">
              <div className="recommendation-name">{suggestedProduct.name}</div>
              <p className="recommendation-pitch">
                Customers who try this one never go back — a rich, smooth roast that turns a good order into a great one. Add it and taste the difference!
              </p>
              <div className="recommendation-meta">{suggestedProduct.weight_grams}g pack · {formatPrice(suggestedProduct.price_cents)}</div>
            </div>
            <button
              className="btn btn-secondary recommendation-btn"
              onClick={() => addItem(suggestedProduct.id, 1, suggestedProduct.quantity)}
            >
              + Add to Bag
            </button>
          </div>
        </div>
      )}

      <div className="checkout-layout">
        {/* Left: form */}
        <div>
          {/* Delivery */}
          <div className="checkout-section card">
            <h3>Delivery Information</h3>
            <div className="form-row" style={{ marginTop: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} placeholder="Jane" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" value={form.customer_surname} onChange={(e) => set('customer_surname', e.target.value)} placeholder="Smith" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Address</label>
              <input className="form-input" value={form.delivery_address} onChange={(e) => set('delivery_address', e.target.value)} placeholder="123 Main St, City, Country" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 234 567 8900" />
            </div>
          </div>

          {/* Payment */}
          <div className="checkout-section card" style={{ marginTop: '1.25rem' }}>
            <h3>Payment Method</h3>
            <div className="payment-options">
              <label className={`payment-option${paymentMethod === 'cash' ? ' selected' : ''}`}>
                <input
                  type="radio" name="payment" value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                />
                <span className="payment-option-icon">🚚</span>
                <span className="payment-option-label">Pay on Delivery</span>
              </label>
              <label className={`payment-option${paymentMethod === 'card' ? ' selected' : ''}`}>
                <input
                  type="radio" name="payment" value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                />
                <span className="payment-option-icon">💳</span>
                <span className="payment-option-label">Pay by Card</span>
              </label>
            </div>

            {paymentMethod === 'card' && (
              <div className="card-fields">
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input
                    className="form-input"
                    value={card.number}
                    onChange={(e) => setCardField('number', formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    inputMode="numeric"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Name on Card</label>
                  <input
                    className="form-input"
                    value={card.name}
                    onChange={(e) => setCardField('name', e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Expiry</label>
                    <input
                      className="form-input"
                      value={card.expiry}
                      onChange={(e) => setCardField('expiry', formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input
                      className="form-input"
                      value={card.cvv}
                      onChange={(e) => setCardField('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Promo */}
          <div className="checkout-section card" style={{ marginTop: '1.25rem' }}>
            <h3>Promo Code</h3>
            <div className="promo-row" style={{ marginTop: '1rem' }}>
              <input
                className="form-input"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Enter code (e.g. DIGISTORE24)"
                disabled={promoApplied}
                onKeyDown={(e) => e.key === 'Enter' && !promoApplied && applyPromo()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-secondary" onClick={applyPromo} disabled={promoApplied}>
                {promoApplied ? '✓ Applied' : 'Apply'}
              </button>
            </div>
            {promoError && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{promoError}</div>}
            {promoApplied && <div className="alert alert-success" style={{ marginTop: '0.75rem' }}>🎉 10% discount applied!</div>}
          </div>
        </div>

        {/* Right: summary */}
        <div className="order-summary card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.4rem' }}>Order Summary</h3>
          {items.map((item) => {
            const p = products[item.productId];
            if (!p) return null;
            return (
              <div className="summary-line" key={item.productId}>
                <span className="summary-line-name">{p.name} <span style={{ color: 'var(--smoke)' }}>× {item.quantity}</span></span>
                <span>{formatPrice(p.price_cents * item.quantity)}</span>
              </div>
            );
          })}
          <hr className="divider" />
          <div className="summary-line">
            <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
          </div>
          {promoApplied && (
            <div className="summary-line" style={{ color: 'var(--green)' }}>
              <span>Discount (10%)</span><span>−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="summary-line" style={{ color: 'var(--smoke)', fontSize: '0.875rem' }}>
            <span>Shipping</span><span>Free</span>
          </div>
          <div className="summary-line" style={{ color: 'var(--smoke)', fontSize: '0.875rem' }}>
            <span>Payment</span>
            <span>{paymentMethod === 'card' ? '💳 Card' : '🚚 On Delivery'}</span>
          </div>
          <div className="summary-line summary-final">
            <span>Total</span><span className="price" style={{ fontSize: '1.25rem' }}>{formatPrice(total)}</span>
          </div>
          <button
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: '1.5rem' }}
            onClick={placeOrder}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : '🛍 Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
