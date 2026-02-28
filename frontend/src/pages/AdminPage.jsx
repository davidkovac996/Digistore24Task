import { useState, useEffect } from 'react';
import api from '../api';
import './Admin.css';

function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

const EMPTY_FORM = {
  name: '', price: '', weight_grams: '', quantity: '', image_url: '',
};

// ── Inventory tab ─────────────────────────────────────────────
function InventoryTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const refresh = () =>
    api.get('/products').then((r) => setProducts(r.data.products)).finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setFormError(''); setModal({ mode: 'add' }); };
  const openEdit = (p) => {
    setForm({
      name: p.name,
      price: (p.price_cents / 100).toFixed(2),
      weight_grams: String(p.weight_grams),
      quantity: String(p.quantity),
      image_url: p.image_url,
    });
    setFormError('');
    setModal({ mode: 'edit', product: p });
  };

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setFormError('');
    const price = parseFloat(form.price);
    const weight = parseInt(form.weight_grams);
    const qty = parseInt(form.quantity);
    if (!form.name.trim()) return setFormError('Name is required.');
    if (isNaN(price) || price <= 0) return setFormError('Price must be greater than 0.');
    if (isNaN(weight) || weight <= 0) return setFormError('Weight must be greater than 0.');
    if (isNaN(qty) || qty < 0) return setFormError('Quantity must be 0 or more.');
    if (!form.image_url.trim()) return setFormError('Image URL is required.');
    const payload = {
      name: form.name.trim(),
      price_cents: Math.round(price * 100),
      weight_grams: weight,
      quantity: qty,
      image_url: form.image_url.trim(),
    };
    setSaving(true);
    try {
      if (modal.mode === 'add') await api.post('/products/admin', payload);
      else await api.put(`/products/admin/${modal.product.id}`, payload);
      setModal(null);
      refresh();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/products/admin/${id}`).catch(() => {});
    setConfirmDelete(null);
    refresh();
  };

  return (
    <>
      <div className="admin-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{products.length} products in the catalogue</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openAdd}>+ Add Product</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: 'var(--caramel)' }} />
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No products yet</h3>
          <p>Add your first product to get started.</p>
        </div>
      ) : (
        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th><th>Name</th><th>Weight</th>
                <th>Price</th><th>Stock</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <img src={p.image_url} alt={p.name} className="admin-product-thumb"
                      onError={(e) => (e.target.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100&q=60')} />
                  </td>
                  <td className="admin-product-name">{p.name}</td>
                  <td>{p.weight_grams}g</td>
                  <td>{formatPrice(p.price_cents)}</td>
                  <td>
                    <span className={`stock-pill ${p.quantity === 0 ? 'stock-zero' : p.quantity < 5 ? 'stock-low' : 'stock-ok'}`}>
                      {p.quantity === 0 ? 'Out of stock' : `${p.quantity} packs`}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.8rem' }}>
                {modal.mode === 'add' ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            {formError && <div className="alert alert-error">{formError}</div>}
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Ethiopian Yirgacheffe" autoFocus />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price ($)</label>
                <input className="form-input" type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="14.99" />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (grams)</label>
                <input className="form-input" type="number" min="1" value={form.weight_grams} onChange={(e) => setField('weight_grams', e.target.value)} placeholder="250" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Stock (packs)</label>
              <input className="form-input" type="number" min="0" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} placeholder="10" />
            </div>
            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input className="form-input" value={form.image_url} onChange={(e) => setField('image_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : modal.mode === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.6rem' }}>Delete Product?</h3>
            <p style={{ color: 'var(--smoke)', marginBottom: '1.75rem', fontWeight: 300 }}>
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>?
              Past orders will be unaffected thanks to price snapshots.
            </p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main admin page ────────────────────────────────────────────
export default function AdminPage() {
  return (
    <div className="page">
      <InventoryTab />
    </div>
  );
}
