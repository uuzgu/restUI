import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handlePaymentSuccess } from '../controllers/paymentController';
import { useDarkMode } from '../DarkModeContext';
import { useLanguage } from '../LanguageContext';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import './PaymentSuccess.css';

// Helper function to format price
const formatPrice = (price) => {
  if (price === undefined || price === null) return '€0.00';
  try {
    return `€${parseFloat(price).toFixed(2)}`;
  } catch (e) {
    console.error('Error formatting price:', e);
    return '€0.00';
  }
};

// Group options by groupName and use item.groupOrder for display order (copied from Basket.js)
function groupOptionsByGroupNameWithOrder(selectedItems) {
  if (!selectedItems) return {};
  const groupMap = {};
  selectedItems.forEach(option => {
    const groupName = option.groupName || 'Other';
    if (!groupMap[groupName]) {
      groupMap[groupName] = {
        name: groupName,
        displayOrder: option.groupDisplayOrder ?? option.displayOrder ?? 9999,
        options: []
      };
    }
    groupMap[groupName].options.push(option);
  });
  return groupMap;
}

const OrderDetailsPopup = ({ orderDetails, onClose }) => {
  const { isDarkMode } = useDarkMode();
  const { language, translations } = useLanguage();

  console.log('OrderDetailsPopup - Full order details:', orderDetails);
  console.log('OrderDetailsPopup - CreatedAt:', orderDetails.CreatedAt);
  console.log('OrderDetailsPopup - createdAt:', orderDetails.createdAt);

  // Helper function to calculate item total
  const calculateItemTotal = (item) => {
    if (!item) return 0;
    try {
      const baseTotal = (item.price || 0) * (item.quantity || 1);
      const optionsTotal = item.selectedItems?.reduce((sum, option) => 
        sum + ((option.price || 0) * (option.quantity || 1)), 0) || 0;
      return baseTotal + optionsTotal;
    } catch (e) {
      console.error('Error calculating item total:', e);
      return 0;
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!orderDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <div className="text-center">
            <p className="text-red-500">No order details available</p>
            <button
              onClick={onClose}
              className="mt-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black bg-opacity-50" style={{ paddingTop: '100px' }} onClick={onClose}>
      <div
        className="relative bg-[var(--popup-container-bg)] rounded-2xl shadow-xl max-w-2xl w-full mx-4 p-6 overflow-y-auto border border-[var(--popup-container-border)]"
        style={{ 
          zIndex: 10000,
          maxHeight: 'calc(100vh - 140px)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--popup-text-tertiary)] hover:text-[var(--popup-text)] transition-colors"
          aria-label="Close order details"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--popup-header-text)]">Order Details</h2>
        </div>

        <div className="mt-4 space-y-6">
          {/* Basic Order Info */}
          <div className="border-b border-[var(--popup-content-border)] pb-6">
            <h3 className="text-xl font-semibold mb-4 text-[var(--popup-header-text)]">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Order Number</div>
                <div className="font-medium text-[var(--popup-text)]">{orderDetails.OrderNumber || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Status</div>
                <div className="font-medium text-[var(--popup-text)] capitalize">{orderDetails.Status}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Payment Method</div>
                <div className="font-medium text-[var(--popup-text)] capitalize">{orderDetails.PaymentMethod || orderDetails.paymentMethod || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Total Amount</div>
                <div className="font-medium text-[var(--popup-text)]">
                  {orderDetails.OriginalTotal && orderDetails.DiscountCoupon === 1 ? (
                    <span>
                      Original Total: €{orderDetails.OriginalTotal?.toFixed(2)}<br />
                      Final Total: €{orderDetails.Total?.toFixed(2)}
                    </span>
                  ) : (
                    <span>€{orderDetails.Total?.toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Discount</div>
                <div className="font-medium text-[var(--popup-text)]">
                  {orderDetails.DiscountCoupon === 1 ? (
                    <span className="text-green-600 dark:text-green-400">Yes</span>
                  ) : (
                    <span>No</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Order Method</div>
                <div className="font-medium text-[var(--popup-text)] capitalize">{orderDetails.OrderMethod}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Created At</div>
                <div className="font-medium text-[var(--popup-text)]">
                  {formatDate(orderDetails.CreatedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-b border-[var(--popup-content-border)] pb-6">
            <h3 className="text-xl font-semibold mb-4 text-[var(--popup-header-text)]">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Name</div>
                <div className="font-medium text-[var(--popup-text)]">
                  {orderDetails.CustomerInfo?.FirstName} {orderDetails.CustomerInfo?.LastName}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Email</div>
                <div className="font-medium text-[var(--popup-text)]">{orderDetails.CustomerInfo?.Email}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Phone</div>
                <div className="font-medium text-[var(--popup-text)]">{orderDetails.CustomerInfo?.Phone}</div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {orderDetails.OrderMethod?.toLowerCase() === 'delivery' && (
            <div className="border-b border-[var(--popup-content-border)] pb-6">
              <h3 className="text-xl font-semibold mb-4 text-[var(--popup-header-text)]">Delivery Address</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="text-[var(--popup-text-tertiary)]">Street</div>
                  <div className="font-medium text-[var(--popup-text)]">{orderDetails.CustomerInfo?.Street || 'N/A'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-[var(--popup-text-tertiary)]">House</div>
                  <div className="font-medium text-[var(--popup-text)]">{orderDetails.CustomerInfo?.House || 'N/A'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-[var(--popup-text-tertiary)]">Postal Code</div>
                  <div className="font-medium text-[var(--popup-text)]">{orderDetails.CustomerInfo?.PostalCode || 'N/A'}</div>
                </div>
                {orderDetails.CustomerInfo?.Stairs && (
                  <div className="space-y-2">
                    <div className="text-[var(--popup-text-tertiary)]">Stairs</div>
                    <div className="font-medium text-[var(--popup-text)]">{orderDetails.CustomerInfo.Stairs}</div>
                  </div>
                )}
                {orderDetails.CustomerInfo?.Stick && (
                  <div className="space-y-2">
                    <div className="text-[var(--popup-text-tertiary)]">Stick</div>
                    <div className="font-medium text-[var(--popup-text)]">{orderDetails.CustomerInfo.Stick}</div>
                  </div>
                )}
                {orderDetails.CustomerInfo?.Door && (
                  <div className="space-y-2">
                    <div className="text-[var(--popup-text-tertiary)]">Door</div>
                    <div className="font-medium text-[var(--popup-text)]">{orderDetails.CustomerInfo.Door}</div>
                  </div>
                )}
                {orderDetails.CustomerInfo?.Bell && (
                  <div className="space-y-2">
                    <div className="text-[var(--popup-text-tertiary)]">Bell</div>
                    <div className="font-medium text-[var(--popup-text)]">{orderDetails.CustomerInfo.Bell}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="border-b border-[var(--popup-content-border)] pb-6">
            <h3 className="text-xl font-semibold mb-4 text-[var(--popup-header-text)]">Order Items</h3>
            <div className="space-y-4">
              {orderDetails.items?.map((item, index) => (
                <div key={index} className="bg-[var(--popup-container-bg)] p-4 rounded-lg border border-[var(--popup-content-border)]">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-[var(--popup-text)]">{item.name}</h4>
                      {item.note && (
                        <p className="text-sm text-[var(--popup-text-tertiary)] italic">{item.note}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-[var(--popup-text)]">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                      <div className="text-sm text-[var(--popup-text-tertiary)]">
                        {item.quantity} x {formatPrice(item.price)}
                      </div>
                    </div>
                  </div>
                  {/* Selected Items */}
                  {item.selectedItems && item.selectedItems.length > 0 && (
                    <div className="mt-2 pl-4 border-l-2 border-[var(--popup-content-border)]">
                      {Object.entries(groupOptionsByGroupNameWithOrder(item.selectedItems))
                        .sort((a, b) => a[1].displayOrder - b[1].displayOrder)
                        .map(([groupName, group]) => (
                          <div key={groupName} className="mb-2">
                            <div className="text-sm font-medium text-[var(--popup-text-tertiary)]">
                              {group.name}:
                            </div>
                            <div className="text-sm text-[var(--popup-text)]">
                              {group.options.map((opt, i, arr) => (
                                <span key={i}>
                                  {opt.name}
                                  {opt.quantity > 1 ? ` x${opt.quantity}` : ''}
                                  {opt.price > 0 ? ` (${formatPrice(opt.price * opt.quantity)})` : ''}
                                  {i < arr.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Special Notes */}
          {orderDetails.SpecialNotes && (
            <div className="border-t border-[var(--popup-content-border)] pt-6">
              <h3 className="text-xl font-semibold mb-4 text-[var(--popup-header-text)]">Special Notes</h3>
              <p className="text-sm text-[var(--popup-text-tertiary)]">
                {orderDetails.SpecialNotes}
              </p>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, translations } = useLanguage();
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const { isDarkMode } = useDarkMode();

  const fetchOrderDetails = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const paymentMethod = localStorage.getItem('paymentMethod') || 'stripe';

      // Always prioritize Stripe session ID in the URL
      if (sessionId) {
        // Stripe flow
        const result = await handlePaymentSuccess(sessionId);
        setOrderDetails(result);
        // Optionally clear cash order data
        localStorage.removeItem('cashOrderId');
        localStorage.removeItem('cashOrderDetails');
        localStorage.setItem('paymentMethod', 'stripe');
      } else if (paymentMethod === 'cash') {
        // Cash flow
        const orderId = localStorage.getItem('cashOrderId') || urlParams.get('orderId');
        if (orderId) {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://restapi-m5th.onrender.com'}/api/Order/${orderId}`);
          const data = await response.json();
          setOrderDetails(data);
        } else {
          setError('No order ID found for cash payment.');
        }
      } else {
        setError('No session ID or order ID found.');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to fetch order details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful</h2>
          <p className="text-gray-600 mb-2">
            Thank you for your order! Your payment has been processed successfully.
          </p>
          {orderDetails && (
            <div
              className={`mb-6 p-4 rounded-lg border shadow-sm ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-100'
                  : 'bg-blue-50 border-blue-200 text-gray-800'
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="font-bold text-lg mr-2">Order #{orderDetails.orderNumber || orderDetails.OrderNumber}</span>
                <span
                  className={`ml-auto px-2 py-1 rounded text-xs font-semibold ${
                    isDarkMode
                      ? 'bg-gray-700 text-blue-200'
                      : 'bg-blue-200 text-blue-800'
                  }`}
                >
                  {orderDetails.orderMethod || orderDetails.OrderMethod}
                </span>
              </div>
              <div className="flex items-center mb-1">
                <span className="font-medium mr-2">Total:</span>
                <span className={`font-bold text-lg ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                  {orderDetails.total !== undefined
                    ? `€${parseFloat(orderDetails.total).toFixed(2)}`
                    : orderDetails.Total !== undefined
                    ? `€${parseFloat(orderDetails.Total).toFixed(2)}`
                    : 'N/A'}
                </span>
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}> 
                <span className="font-medium">Delivery Method:</span> {orderDetails.orderMethod || orderDetails.OrderMethod}
              </div>
            </div>
          )}
          {error && (
            <p className="text-red-500 mb-4">{error}</p>
          )}
          <div className="space-y-4">
            <button
              onClick={() => setShowOrderDetails(true)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              View Order Details
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
      {showOrderDetails && orderDetails && (
        <OrderDetailsPopup
          orderDetails={orderDetails}
          onClose={() => setShowOrderDetails(false)}
        />
      )}
    </div>
  );
};

export default PaymentSuccess; 