import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handlePaymentCancel, getStoredCheckoutData } from '../controllers/paymentController';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processCancellation = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (sessionId) {
          await handlePaymentCancel(sessionId);
        }
      } catch (err) {
        console.error('Error processing cancellation:', err);
        setError('Failed to process payment cancellation');
      } finally {
        setIsLoading(false);
      }
    };

    processCancellation();
  }, []);

  const handleRetry = () => {
    const checkoutData = getStoredCheckoutData();
    if (checkoutData) {
      // Navigate to checkout with stored data
      navigate('/checkout', { 
        state: { 
          items: checkoutData.items,
          customerInfo: checkoutData.customerInfo,
          orderMethod: checkoutData.orderMethod,
          paymentMethod: checkoutData.paymentMethod
        }
      });
    } else {
      // If no stored data, just go to checkout
      navigate('/checkout');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-responsive-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-responsive-spinner w-responsive-spinner border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-responsive text-gray-600">Processing cancellation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-responsive-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-responsive">
        <div className="text-center">
          <div className="text-red-500 text-responsive-6xl mb-responsive">
            <i className="fas fa-times-circle"></i>
          </div>
          <h2 className="text-responsive-2xl font-bold text-gray-800 mb-responsive">Payment Cancelled</h2>
          <p className="text-gray-600 mb-responsive">
            Your payment was cancelled. Would you like to try again?
          </p>
          {error && (
            <p className="text-red-500 mb-responsive">{error}</p>
          )}
          <div className="space-y-responsive">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white py-responsive px-responsive rounded-md hover:bg-blue-700 transition duration-200"
            >
              Retry Payment
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 text-gray-800 py-responsive px-responsive rounded-md hover:bg-gray-300 transition duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel; 