import React, { createContext, useContext, useState } from 'react';

const defaultOrder = {
  deliveryAddress: {
    postalCode: '',
    street: '',
    house: '',
    stairs: '',
    stick: '',
    door: '',
    bell: ''
  }
};

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [order, setOrder] = useState(defaultOrder);

  const updateOrder = (newOrder) => {
    setOrder(newOrder);
  };

  return (
    <OrderContext.Provider value={{ order, updateOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}; 