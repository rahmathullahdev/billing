'use client';
import { createContext, useEffect, useState, useMemo, useContext } from 'react';

export const AppContext = createContext(null);

export const AppContextProvider = ({ children }) => {
  const [auth, setAuth] = useState({ user: null, role: null, loading: true });
  const [cartItems, setCartItems] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [pageAccessRules, setPageAccessRules] = useState([]);

  // Load session from API on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setAuth({ user: data.user, role: data.role, loading: false });
        } else {
          setAuth({ user: null, role: null, loading: false });
        }
      } catch {
        setAuth({ user: null, role: null, loading: false });
      }
    }
    loadSession();
  }, []);

  // Load items and page access when authenticated
  useEffect(() => {
    if (!auth.user) return;
    async function loadData() {
      try {
        const [itemsRes, pageRes] = await Promise.allSettled([
          fetch('/api/items').then(r => r.json()),
          fetch('/api/page-access').then(r => r.json()),
        ]);
        if (itemsRes.status === 'fulfilled') setItemsData(itemsRes.value?.data || []);
        if (pageRes.status === 'fulfilled') setPageAccessRules(pageRes.value || []);
      } catch (e) {
        console.error('Failed to load protected data', e);
      }
    }
    loadData();
  }, [auth.user]);

  // Cart Management
  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.itemId === item.itemId);
      if (existing) {
        return prev.map(c => c.itemId === item.itemId ? { ...c, quantity: c.quantity + 1, price: item.price } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => setCartItems(prev => prev.filter(i => i.itemId !== itemId));

  const updateQuantity = (itemId, newQuantity) => {
    setCartItems(prev => prev.map(i => i.itemId === itemId ? { ...i, quantity: newQuantity } : i));
  };

  const updateCustomPrice = (itemId, customPrice) => {
    setCartItems(prev => prev.map(i => {
      if (i.itemId !== itemId) return i;
      const parsed = parseFloat(customPrice);
      return { ...i, customPrice: !isNaN(parsed) && parsed >= 0 ? parsed : null };
    }));
  };

  const clearCart = () => setCartItems([]);

  const setAuthData = (user, role) => setAuth({ user, role, loading: false });

  const hasAccess = (pageIdentifier) => {
    if (!auth.role) return false;
    if (auth.role === 'ROLE_ADMIN') return true;
    if (!pageAccessRules || pageAccessRules.length === 0) return false;
    const rule = pageAccessRules.find(r => r.page === pageIdentifier);
    if (!rule) return false;
    const roleKey = auth.role === 'ROLE_MANAGER' ? 'manager' : 'employee';
    return !!rule[roleKey];
  };

  const contextValue = useMemo(() => ({
    auth,
    setAuthData,
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCustomPrice,
    clearCart,
    itemsData,
    setItemsData,
    pageAccessRules,
    setPageAccessRules,
    hasAccess,
  }), [auth, cartItems, itemsData, pageAccessRules]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
