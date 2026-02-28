import { createContext, useContext, useState, useEffect } from 'react';

const BagContext = createContext(null);

export function BagProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bt_bag')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bt_bag', JSON.stringify(items));
  }, [items]);

  const addItem = (productId, qty = 1, maxQty) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(i.quantity + qty, maxQty) }
            : i
        );
      }
      return [...prev, { productId, quantity: qty }];
    });
  };

  const updateQty = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      );
    }
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearBag = () => setItems([]);

  const bagCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <BagContext.Provider value={{ items, addItem, updateQty, removeItem, clearBag, bagCount }}>
      {children}
    </BagContext.Provider>
  );
}

export function useBag() {
  return useContext(BagContext);
}
