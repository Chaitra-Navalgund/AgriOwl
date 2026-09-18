import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('agriowl_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [directBuyItem, setDirectBuyItem] = useState(null);

  useEffect(() => {
    localStorage.setItem('agriowl_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, selectedVariant, quantity = 1) => {
    setCartItems(prev => {
      const variant = selectedVariant || (product.variants && product.variants[0]);
      if (!variant) return prev;

      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.variant.id === variant.id
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, variant, quantity }];
      }
    });
  };

  const startDirectBuy = (product, selectedVariant, quantity = 1) => {
    const variant = selectedVariant || (product.variants && product.variants[0]);
    if (!variant) return;
    setDirectBuyItem({ product, variant, quantity });
  };

  const clearDirectBuy = () => {
    setDirectBuyItem(null);
  };

  const updateQuantity = (productId, variantId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCartItems(prev => prev.map(item => {
      if (item.product.id === productId && item.variant.id === variantId) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId, variantId) => {
    setCartItems(prev => prev.filter(
      item => !(item.product.id === productId && item.variant.id === variantId)
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((sum, item) => {
    const price = item.variant.discounted_price || (item.variant.price * (1 - (item.variant.discount || 0)/100));
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      directBuyItem,
      startDirectBuy,
      clearDirectBuy,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
