import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handlePaymentSuccess } from '../controllers/paymentController';
import { useDarkMode } from '../DarkModeContext';
import { useLanguage } from '../LanguageContext';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import '../colors/paymentSuccessColors.css';
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
                      Original Total: €{parseFloat(orderDetails.OriginalTotal).toFixed(2)}<br />
                      Final Total: €{parseFloat(orderDetails.Total).toFixed(2)}
                    </span>
                  ) : (
                    <span>€{parseFloat(orderDetails.Total).toFixed(2)}</span>
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
                        {formatPrice(item.price)}
                      </div>
                      <div className="text-sm text-[var(--popup-text-tertiary)]">
                        {item.quantity} x {formatPrice(item.price / item.quantity)}
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
        // Normalize Items to items
        if (result.Items && !result.items) {
          result.items = result.Items;
        }
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
          
          // Get the stored cash order details which has the correct total
          const storedCashOrderDetails = localStorage.getItem('cashOrderDetails');
          const cashOrderDetails = storedCashOrderDetails ? JSON.parse(storedCashOrderDetails) : null;
          
          // Map the response data to match the expected format
          const mappedData = {
            ...data,
            // Map exact response fields
            OrderId: data.OrderId,
            OrderNumber: data.OrderNumber,
            Status: data.Status,
            Total: cashOrderDetails?.Total || data.Total,
            PaymentMethod: data.PaymentMethod,
            OrderMethod: data.OrderMethod,
            CreatedAt: data.CreatedAt,
            DiscountCoupon: data.DiscountCoupon,
            CustomerInfo: data.CustomerInfo,
            OriginalTotal: data.OriginalTotal,  // Use data.OriginalTotal directly
            
            // Keep lowercase versions for backward compatibility
            orderId: data.OrderId,
            orderNumber: data.OrderNumber,
            status: data.Status,
            total: cashOrderDetails?.Total || data.Total,
            paymentMethod: data.PaymentMethod,
            orderMethod: data.OrderMethod,
            createdAt: data.CreatedAt,
            discountCoupon: data.DiscountCoupon,
            originalTotal: data.OriginalTotal,  // Use data.OriginalTotal directly
            customerInfo: {
              firstName: data.CustomerInfo?.FirstName,
              lastName: data.CustomerInfo?.LastName,
              email: data.CustomerInfo?.Email,
              phone: data.CustomerInfo?.Phone,
              postalCode: data.CustomerInfo?.PostalCode,
              street: data.CustomerInfo?.Street,
              house: data.CustomerInfo?.House,
              stairs: data.CustomerInfo?.Stairs,
              stick: data.CustomerInfo?.Stick,
              door: data.CustomerInfo?.Door,
              bell: data.CustomerInfo?.Bell,
              specialNotes: data.CustomerInfo?.SpecialNotes || data.SpecialNotes
            },
            
            // Order items with proper formatting
            items: data.Items?.map(item => ({
              id: item.Id,
              name: item.Name,
              price: item.Price,
              quantity: item.Quantity,
              note: item.Note || '',
              selectedItems: item.SelectedItems?.map(selected => ({
                id: selected.id,
                name: selected.name,
                price: selected.price || 0,
                quantity: selected.quantity || 1,
                groupName: selected.groupName || 'Other',
                groupDisplayOrder: item.GroupOrder?.indexOf(selected.groupName) ?? 9999,
                type: selected.type || '',
                displayOrder: selected.displayOrder || 9999
              })) || []
            })) || []
          };
          
          setOrderDetails(mappedData);
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
      <div className="min-h-responsive-screen flex items-center justify-center" style={{ backgroundColor: 'var(--payment-success-container-bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-responsive-spinner w-responsive-spinner border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-responsive" style={{ color: 'var(--payment-success-text)' }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-responsive-screen flex items-center justify-center" style={{ backgroundColor: 'var(--payment-success-container-bg)' }}>
      <div className="max-w-md w-full rounded-lg shadow-lg p-responsive" style={{ 
        backgroundColor: 'var(--payment-success-content-bg)',
        borderColor: 'var(--payment-success-content-border)'
      }}>
        <div className="text-center">
          <div className="text-responsive-6xl mb-responsive" style={{ color: 'var(--payment-success-icon)' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <h2 className="text-responsive-2xl font-bold mb-responsive" style={{ color: 'var(--payment-success-heading)' }}>
            Payment Successful
          </h2>
          <p className="mb-responsive" style={{ color: 'var(--payment-success-text)' }}>
            Thank you for your order! Your payment has been processed successfully.
          </p>
          {orderDetails && (
            <div
              className="mb-responsive p-responsive rounded-lg border shadow-sm"
              style={{
                backgroundColor: 'var(--payment-success-details-bg)',
                borderColor: 'var(--payment-success-details-border)',
                color: 'var(--payment-success-details-text)'
              }}
            >
              <div className="flex items-center mb-responsive">
                <span className="font-bold text-responsive-lg mr-2" style={{ color: 'var(--payment-success-heading)' }}>
                  Order #{orderDetails.orderNumber || orderDetails.OrderNumber}
                </span>
                <span
                  className="ml-auto px-responsive py-responsive rounded text-responsive-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--payment-success-details-bg)',
                    color: 'var(--payment-success-text)'
                  }}
                >
                  {orderDetails.orderMethod || orderDetails.OrderMethod}
                </span>
              </div>
              <div className="flex items-center mb-responsive">
                <span className="font-medium mr-2" style={{ color: 'var(--payment-success-text)' }}>Total:</span>
                <span className="font-bold text-responsive-lg" style={{ color: 'var(--payment-success-total)' }}>
                  €{parseFloat(orderDetails.total || orderDetails.Total).toFixed(2)}
                </span>
              </div>
              <div className="text-responsive-sm" style={{ color: 'var(--payment-success-text)' }}> 
                <span className="font-medium">Delivery Method:</span> {orderDetails.orderMethod || orderDetails.OrderMethod}
              </div>
            </div>
          )}
          {error && (
            <p className="text-red-500 mb-responsive">{error}</p>
          )}
          <div className="space-y-responsive">
            <button
              onClick={() => setShowOrderDetails(true)}
              className="w-full py-responsive px-responsive rounded-md transition duration-200"
              style={{
                backgroundColor: 'var(--payment-success-primary-bg)',
                color: 'var(--payment-success-primary-text)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'var(--payment-success-primary-hover)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'var(--payment-success-primary-bg)'}
            >
              View Order Details
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-responsive px-responsive rounded-md transition duration-200"
              style={{
                backgroundColor: 'var(--payment-success-secondary-bg)',
                color: 'var(--payment-success-secondary-text)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'var(--payment-success-secondary-hover)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'var(--payment-success-secondary-bg)'}
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