import React, { createContext, useContext, useState } from 'react';

const BasketContext = createContext();

export const useBasket = () => {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
};

export const BasketProvider = ({ children }) => {
  const [basket, setBasket] = useState([]);

  const addToBasket = (item) => {
    setBasket(prevBasket => {
      // Check if item already exists in basket with the same ingredients
      const existingItemIndex = prevBasket.findIndex(
        basketItem => 
          basketItem.id === item.id && 
          JSON.stringify(basketItem.selectedIngredients) === JSON.stringify(item.selectedIngredients) &&
          JSON.stringify(basketItem.selectedDrinks) === JSON.stringify(item.selectedDrinks) &&
          JSON.stringify(basketItem.selectedSides) === JSON.stringify(item.selectedSides) &&
          JSON.stringify(basketItem.selectedOffers) === JSON.stringify(item.selectedOffers)
      );

      if (existingItemIndex !== -1) {
        // Update quantity if item exists with the same selections
        const updatedBasket = [...prevBasket];
        updatedBasket[existingItemIndex] = {
          ...updatedBasket[existingItemIndex],
          quantity: updatedBasket[existingItemIndex].quantity + item.quantity
        };
        return updatedBasket;
      }

      // Add new item if it doesn't exist or has different selections
      return [...prevBasket, item];
    });
  };

  const removeFromBasket = (index) => {
    setBasket(prevBasket => prevBasket.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromBasket(index);
      return;
    }

    setBasket(prevBasket => 
      prevBasket.map((item, i) => 
        i === index ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearBasket = () => {
    setBasket([]);
  };

  const value = {
    basket,
    addToBasket,
    removeFromBasket,
    updateQuantity,
    clearBasket
  };

  return (
    <BasketContext.Provider value={value}>
      {children}
    </BasketContext.Provider>
  );
}; 