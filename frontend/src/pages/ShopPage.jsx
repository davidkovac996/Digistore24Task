import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useBag } from '../context/BagContext';
import './Shop.css';

function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qtys, setQtys] = useState({});
  const [addedMap, setAddedMap] = useState({});
  const { addItem } = useBag();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/products')
      .then((r) => setProducts(r.data.products))
      .catch(() => setError('Could not load products.'))
      .finally(() => setLoading(false));
  }, []);

  const getQty = (id) => qtys[id] || 1;

  const changeQty = (id, delta, max) => {
    setQtys((prev) => ({
      ...prev,
      [id]: Math.max(1, Math.min((prev[id] || 1) + delta, max)),
    }));
  };

  const handleAdd = (product) => {
    const qty = getQty(product.id);
    addItem(product.id, qty, product.quantity);
    setAddedMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedMap((prev) => ({ ...prev, [product.id]: false })), 1800);
    setQtys((prev) => ({ ...prev, [product.id]: 1 }));
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
      {/* Hero */}
      <div className="shop-hero">
        <div className="shop-hero-text">
          <h1>Single-Origin Coffees</h1>
          <p>Freshly roasted. Carefully sourced. Delivered to your door.</p>
        </div>
        <div className="shop-hero-visual">☕</div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No products yet</h3>
          <p>Check back soon — our roasters are busy!</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => {
            const qty = getQty(p.id);
            const added = addedMap[p.id];
            const outOfStock = p.quantity === 0;

            return (
              <div className="product-card" key={p.id}>
                <div className="product-card-img">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    onError={(e) =>
                      (e.target.src =
                        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80')
                    }
                  />
                  {outOfStock && <div className="sold-out-overlay">Sold Out</div>}
                </div>
                <div className="product-card-body">
                  <div className="product-name">{p.name}</div>
                  <div className="product-meta">{p.weight_grams}g pack</div>
                  <div className="product-stock">
                    {outOfStock ? (
                      <span className="stock-empty">Out of stock</span>
                    ) : (
                      <span className="stock-count">{p.quantity} packs available</span>
                    )}
                  </div>
                  <div className="product-footer">
                    <span className="price">{formatPrice(p.price_cents)}</span>
                  </div>
                  {!outOfStock && (
                    <>
                      <div className="qty-selector" style={{ marginTop: '0.85rem' }}>
                        <button className="qty-btn" onClick={() => changeQty(p.id, -1, p.quantity)} disabled={qty <= 1}>−</button>
                        <span className="qty-num">{qty}</span>
                        <button className="qty-btn" onClick={() => changeQty(p.id, +1, p.quantity)} disabled={qty >= p.quantity}>+</button>
                        <span style={{ fontSize: '0.78rem', color: 'var(--smoke)' }}>/ {p.quantity}</span>
                      </div>
                      <button
                        className={`btn btn-full ${added ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ marginTop: '0.75rem' }}
                        onClick={() => handleAdd(p)}
                      >
                        {added ? '✓ Added to Chart' : 'Add to Chart'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
