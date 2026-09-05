'use client';
import { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import { AppContext } from '@/context/AppContext';

export default function ExplorePage() {
  const { cartItems, addToCart, removeFromCart, updateQuantity, updateCustomPrice, clearCart, itemsData, setItemsData } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemsData || itemsData.length === 0) {
      setLoading(true);
      fetch('/api/items').then(r => r.json()).then(d => setItemsData(d.data || [])).finally(() => setLoading(false));
    }
  }, []);

  const filtered = (itemsData || []).filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));
  const cartTotal = cartItems.reduce((s, i) => {
    const price = i.customPrice !== null && i.customPrice !== undefined ? i.customPrice : i.price;
    return s + price * i.quantity;
  }, 0);

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 55px)', gap: 0 }}>
      {/* Items Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem 1.5rem' }}>
        <div className="page-header" style={{ padding: 0, marginBottom: '1rem' }}>
          <h1 className="page-title"><i className="bi bi-cart3" style={{ color: '#e64051', marginRight: '0.5rem' }}></i>Explore Items</h1>
          <p className="page-subtitle">Select items to add to cart</p>
        </div>
        <div className="search-box mb-3">
          <i className="bi bi-search search-icon"></i>
          <input className="form-control" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner"></div></div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {filtered.map(item => {
              const inCart = cartItems.find(c => c.itemId === item.itemId || c._id === item._id);
              return (
                <div key={item._id} className="card card-sm" style={{ cursor: 'pointer', transition: 'all 0.2s', border: inCart ? '1.5px solid #002142' : '1px solid #eef4f8' }}
                  onClick={() => { addToCart({ ...item, itemId: item.itemId || item._id }); toast.success(`${item.name} added`); }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                    <i className="bi bi-box" style={{ color: '#002142' }}></i>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{item.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#e64051', fontWeight: 700, marginTop: '0.25rem' }}>₹{item.price}</div>
                  {inCart && <div className="badge badge-success" style={{ marginTop: '0.3rem' }}>In Cart ({inCart.quantity})</div>}
                </div>
              );
            })}
            {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><i className="bi bi-search"></i><p>No items found</p></div>}
          </div>
        )}
      </div>

      {/* Cart */}
      <div style={{ width: 320, borderLeft: '1px solid #eef4f8', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #eef4f8', fontWeight: 700, color: '#002142' }}>
          <i className="bi bi-cart3" style={{ marginRight: '0.4rem' }}></i>Cart ({cartItems.length})
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
          {cartItems.length === 0 ? (
            <div className="empty-state"><i className="bi bi-cart"></i><p>Cart is empty</p></div>
          ) : cartItems.map(item => (
            <div key={item.itemId || item._id} style={{ padding: '0.6rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', flex: 1 }}>{item.name}</span>
                <button className="btn-icon" onClick={() => removeFromCart(item.itemId || item._id)}>
                  <i className="bi bi-trash" style={{ color: '#ef4444', fontSize: '0.8rem' }}></i>
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                <input type="number" className="form-control" style={{ width: 60, padding: '0.25rem 0.4rem', fontSize: '0.8rem' }}
                  value={item.quantity} min={1} onChange={e => updateQuantity(item.itemId || item._id, parseInt(e.target.value) || 1)} />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>×</span>
                <input type="number" className="form-control" style={{ width: 80, padding: '0.25rem 0.4rem', fontSize: '0.8rem' }}
                  value={item.customPrice !== null && item.customPrice !== undefined ? item.customPrice : item.price}
                  onChange={e => updateCustomPrice(item.itemId || item._id, e.target.value)} />
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#002142', marginTop: '0.25rem' }}>
                {fmt((item.customPrice !== null && item.customPrice !== undefined ? item.customPrice : item.price) * item.quantity)}
              </div>
            </div>
          ))}
        </div>
        {cartItems.length > 0 && (
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #eef4f8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>
              <span>Total</span><span style={{ color: '#002142' }}>{fmt(cartTotal)}</span>
            </div>
            <a href="/bills/create" className="btn-primary w-full" style={{ justifyContent: 'center', display: 'flex' }}>
              <i className="bi bi-receipt"></i> Create Bill
            </a>
            <button className="btn-outline w-full mt-2" onClick={clearCart}>
              <i className="bi bi-trash"></i> Clear Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
