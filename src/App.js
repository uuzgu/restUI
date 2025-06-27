// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  const [basket, setBasket] = useState([]);
  const { darkMode } = useDarkMode();

  // Set --vh CSS variable for proper viewport height calculation
  useEffect(() => {
    const setVh = () => {
      // Get the viewport height and calculate 1% of it
      const vh = window.innerHeight * 0.01;
      // Set the value in the --vh custom property
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Initial set
    setVh();

    // Add event listeners for when viewport changes
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);

    // Also listen for when the viewport changes due to browser UI
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setVh);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setVh);
      }
    };
  }, []);

  const toggleBasket = () => {
    setBasketVisible(!basketVisible);
  };

  // Calculate total basket count
  const basketCount = basket.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <ApiProvider>
      <OrderProvider>
        <div className={`App ${darkMode ? 'dark' : ''} min-h-screen-dynamic bg-primary text-primary transition-colors duration-300`}>
          <div className="fixed top-0 left-0 right-0 z-40 h-responsive-header">
            <Header 
              basketCount={basketCount}
              onBasketToggle={toggleBasket}
              basketVisible={basketVisible}
            />
          </div>
          
          <main 
            className="relative z-10 flex-1 h-responsive-container"
            style={{ paddingTop: 'var(--header-height)' }}
          >
            <Routes>
              <Route path="/" element={<Home />} />  {/* Home route */}
              <Route 
                path="/order" 
                element={
                  <ItemList 
                    basketVisible={basketVisible} 
                    setBasketVisible={setBasketVisible}
                    basket={basket}
                    setBasket={setBasket}
                  />
                } 
              />  {/* Order route */}
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
              <Route path="/coupons" element={<CouponManager />} />
            </Routes>
          </main>
        </div>
      </OrderProvider>
    </ApiProvider>
  );
}

export default App;
