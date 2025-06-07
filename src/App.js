// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Header from './components/Header';
import './index.css';
import './colors/orderColors.css'; // Import order colors
import ItemList from './components/ItemList'; // Order page
import Checkout from './components/Checkout';
import Home from './components/Home'; // Import Home component
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';
import { ApiProvider } from './contexts/ApiContext';
import { OrderProvider } from './contexts/OrderContext';
import CouponManager from './components/CouponManager';
import { useDarkMode } from './DarkModeContext';

function App() {
  const [basketVisible, setBasketVisible] = useState(false);
  const { darkMode } = useDarkMode();

  const toggleBasket = () => {
    setBasketVisible(!basketVisible);
  };

  return (
    <ApiProvider>
      <OrderProvider>
        <div className={`min-h-screen bg-white dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
          <Header toggleBasket={toggleBasket} basketVisible={basketVisible} />
          <Routes>
            <Route path="/" element={<Home />} />  {/* Home route */}
            <Route path="/order" element={<ItemList basketVisible={basketVisible} setBasketVisible={setBasketVisible} />} />  {/* Order route */}
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/coupons" element={<CouponManager />} />
          </Routes>
        </div>
      </OrderProvider>
    </ApiProvider>
  );
}

export default App;
