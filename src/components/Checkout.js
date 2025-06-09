import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
import BasketSummary from "../components/BasketSummary";
import PostalCodeSelector from "./PostalCodeSelector";
import { ArrowLeft } from 'lucide-react';
import "../Checkout.css";
import "../colors/checkoutColors.css";
import { createCheckoutSession, getMinimumOrderValue, storeCheckoutData, clearAllStoredData, getBaseUrl } from "../controllers/paymentController";
import { OrderProvider } from "../contexts/OrderContext";
import { ApiProvider } from "../contexts/ApiContext";

const CouponScheduleInfo = ({ schedule }) => {
  if (!schedule) return null;

  const validDays = Object.entries(schedule.validDays)
    .filter(([_, isValid]) => isValid)
    .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
    .join(', ');

  return (
    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
      <p>Valid on: {validDays}</p>
      <p>Valid hours: {schedule.beginTime} - {schedule.endTime}</p>
    </div>
  );
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

const Checkout = ({ basket: propBasket, setBasket: propSetBasket, orderMethod: propOrderMethod, onOrderMethodChange: propOnOrderMethodChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, translations } = useLanguage();
  
  // Get basket and orderMethod from props, location state, or stored checkout data
  const getInitialData = () => {
    // First check location state (for retry or from order page)
    if (location.state?.basket) {
      return {
        basket: location.state.basket,
        orderMethod: location.state.orderMethod || 'delivery',
        customerInfo: location.state.customerInfo || {}
      };
    }
    
    // Then check props
    if (propBasket) {
      return {
        basket: propBasket,
        orderMethod: propOrderMethod || 'delivery',
        customerInfo: {}
      };
    }
    
    // Finally check localStorage
    const storedData = localStorage.getItem('checkoutData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        return {
          basket: data.items || [],
          orderMethod: data.orderMethod || 'delivery',
          customerInfo: data.customerInfo || {}
        };
      } catch (e) {
        console.error('Error parsing stored checkout data:', e);
      }
    }
    
    // Default values
    return {
      basket: [],
      orderMethod: 'delivery',
      customerInfo: {}
    };
  };

  const initialData = getInitialData();
  
  // Initialize state with the data
  const [formData, setFormData] = useState({
    firstName: initialData.customerInfo.firstName || "",
    lastName: initialData.customerInfo.lastName || "",
    email: initialData.customerInfo.email || "",
    phone: initialData.customerInfo.phone || "",
    address: initialData.customerInfo.street || "",
    city: "",
    postalCode: initialData.customerInfo.postalCode || "",
    country: "",
    orderNotes: initialData.customerInfo.specialNotes || "",
    house: initialData.customerInfo.house || "",
    stairs: initialData.customerInfo.stairs || "",
    stick: initialData.customerInfo.stick || "",
    door: initialData.customerInfo.door || "",
    bell: initialData.customerInfo.bell || ""
  });
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [showCouponRemovedMessage, setShowCouponRemovedMessage] = useState(false);
  const [previousBasketState, setPreviousBasketState] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(initialData.customerInfo.paymentMethod || "stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [minimumOrderValue, setMinimumOrderValue] = useState(0);
  const [highlightMinimumOrder, setHighlightMinimumOrder] = useState(false);
  const minimumOrderRef = useRef(null);
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const postalCodeRef = useRef(null);
  const addressRef = useRef(null);
  const houseRef = useRef(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [showCouponSuccess, setShowCouponSuccess] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Initialize local state
  const [localBasket, setLocalBasket] = useState(initialData.basket);
  const [localOrderMethod, setLocalOrderMethod] = useState(initialData.orderMethod);

  // Check if there's an applied coupon in the basket
  useEffect(() => {
    const hasAppliedCoupon = localBasket.some(item => item.discountedPrice !== undefined);
    if (hasAppliedCoupon) {
      // If there's a discount, set the applied coupon state
      setAppliedCoupon({ code: 'Applied Coupon' }); // We don't need the actual coupon details
    }
  }, [localBasket]);

  // Use prop functions if provided, otherwise use local state
  const setBasket = (newBasket) => {
    setLocalBasket(newBasket);
    if (propSetBasket) propSetBasket(newBasket);
  };
  const onOrderMethodChange = (newMethod) => {
    setLocalOrderMethod(newMethod);
    if (propOnOrderMethodChange) propOnOrderMethodChange(newMethod);
  };

  // Update local basket when location state changes
  useEffect(() => {
    if (location.state?.basket) {
      setLocalBasket(location.state.basket);
    }
  }, [location.state?.basket]);

  // Update local order method when location state changes
  useEffect(() => {
    if (location.state?.orderMethod) {
      setLocalOrderMethod(location.state.orderMethod);
    }
  }, [location.state?.orderMethod]);

  // Update basket in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('basket', JSON.stringify(localBasket));
  }, [localBasket]);

  // Initialize form with stored data
  useEffect(() => {
    const storedCheckoutData = localStorage.getItem('checkoutData');
    if (storedCheckoutData) {
      const checkoutData = JSON.parse(storedCheckoutData);
      if (checkoutData.customerInfo) {
        setFormData(checkoutData.customerInfo);
      }
    }
  }, []);

  // Fetch minimum order value when postal code changes
  useEffect(() => {
    const fetchMinimumOrderValue = async () => {
      if (formData.postalCode) {
        const value = await getMinimumOrderValue(formData.postalCode);
        setMinimumOrderValue(value);
      }
    };
    fetchMinimumOrderValue();
  }, [formData.postalCode]);

  // Clear stored data when starting a new order
  useEffect(() => {
    if (!location.state?.basket && !propBasket) {
      clearAllStoredData();
    }
  }, [location.state?.basket, propBasket]);

  const handleBackToOrder = () => {
    // Only show warning if there was an applied coupon
    const hadCoupon = localBasket.some(item => item.discountedPrice !== undefined);
    
    // Reset coupon state but preserve discounted prices
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    
    navigate('/order', { 
      state: { 
        basket: localBasket, // Pass the basket with discounted prices
        orderMethod: localOrderMethod,
        showCouponWarning: false // Don't show warning since we're preserving the discount
      } 
    });
  };

  // Update basket when items change
  useEffect(() => {
    if (appliedCoupon) {
      // Check if any item's quantity has changed from its original state
      const hasQuantityChanged = localBasket.some(item => {
        const originalItem = previousBasketState?.find(prevItem => prevItem.id === item.id);
        return originalItem && originalItem.quantity !== item.quantity;
      });

      if (hasQuantityChanged || location.state?.basketModified) {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('Basket is updated, coupon can be applied again');
        
        // Reset prices to original
        const resetBasket = localBasket.map(item => ({
          ...item,
          discountedPrice: undefined,
          discountPercentage: undefined
        }));
        setBasket(resetBasket);
      }
    }
  }, [localBasket, appliedCoupon, previousBasketState, location.state?.basketModified, setBasket]);

  // Store previous basket state for comparison
  useEffect(() => {
    setPreviousBasketState(localBasket);
  }, [localBasket]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateBasketTotal = () => {
    console.log('Calculating basket total with items:', localBasket);
    const total = localBasket.reduce((sum, item) => {
      // Use discountedPrice if available, otherwise fall back to originalPrice
      const price = item.discountedPrice !== undefined ? item.discountedPrice : item.originalPrice;
      // Add selected options price
      const optionsTotal = (item.selectedItems || []).reduce((optSum, opt) => {
        return optSum + ((opt.price || 0) * (opt.quantity || 1));
      }, 0);
      return sum + ((price * item.quantity) + optionsTotal);
    }, 0);
    console.log('Total calculated:', total);
    return total;
  };

  const calculateOriginalBasketTotal = () => {
    return localBasket.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }
    
    try {
      setIsProcessing(true);
      setFormErrors({});

      // First check - if it's a delivery order, postal code and address are mandatory
      if (localOrderMethod === 'delivery') {
        if (!formData.postalCode || !formData.street) {
          setIsProcessing(false);
          setFormErrors({
            submit: 'Please select both postal code and address to proceed with payment'
          });
          
          // Highlight the missing fields
          if (!formData.postalCode && postalCodeRef.current) {
            postalCodeRef.current.classList.add('highlight-error');
            postalCodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          if (!formData.street && addressRef.current) {
            addressRef.current.classList.add('highlight-error');
            addressRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
      }

      // Validate other form data
      const errors = {};
      if (!formData.firstName) errors.firstName = 'First name is required';
      if (!formData.lastName) errors.lastName = 'Last name is required';
      if (!formData.email) errors.email = 'Email is required';
      if (!formData.phone) errors.phone = 'Phone is required';

      if (localOrderMethod === 'delivery') {
        if (!formData.house) errors.house = 'House number is required';
        
        // Check minimum order value for delivery using original price
        const originalBasketTotal = calculateOriginalBasketTotal();
        if (minimumOrderValue > 0 && originalBasketTotal < minimumOrderValue) {
          errors.submit = `Minimum order value for this area is €${minimumOrderValue.toFixed(2)}. Please add more items to your basket.`;
          setFormErrors(errors);
          setIsProcessing(false);
          
          minimumOrderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightMinimumOrder(true);
          setTimeout(() => setHighlightMinimumOrder(false), 1000);
          return;
        }
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setIsProcessing(false);

        const errorField = Object.keys(errors)[0];
        const refMap = {
          firstName: firstNameRef,
          lastName: lastNameRef,
          email: emailRef,
          phone: phoneRef,
          house: houseRef
        };

        const targetRef = refMap[errorField];
        if (targetRef?.current) {
          targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetRef.current.classList.add('highlight-error');
          setTimeout(() => {
            targetRef.current?.classList.remove('highlight-error');
          }, 1000);
        }
        return;
      }

      // Check if basket is empty
      if (!localBasket || localBasket.length === 0) {
        setFormErrors({ submit: 'Your basket is empty' });
        setIsProcessing(false);
        return;
      }

      // Prepare customer info
      const customerInfo = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        specialNotes: formData.specialNotes,
        ...(localOrderMethod === 'delivery' && {
          postalCode: formData.postalCode,
          street: formData.street,
          house: formData.house,
          stairs: formData.stairs,
          stick: formData.stick,
          door: formData.door,
          bell: formData.bell
        })
      };

      // Calculate total amount
      const totalAmount = localBasket.reduce((sum, item) => {
        const price = item.discountedPrice !== undefined ? item.discountedPrice : item.originalPrice;
        return sum + (price * item.quantity);
      }, 0);

      // Process the order based on payment method
      const mappedItems = localBasket.map(item => ({
        id: item.id,
        name: item.name,
        price: item.discountedPrice !== undefined ? item.discountedPrice : item.originalPrice,
        originalPrice: item.originalPrice,
        discountedPrice: item.discountedPrice,
        quantity: item.quantity,
        note: item.note || "",
        selectedItems: (item.selectedItems || []).map(opt => ({
          id: opt.id,
          name: opt.name,
          groupName: opt.groupName,
          type: opt.type,
          price: opt.price,
          quantity: opt.quantity,
        })),
        groupOrder: item.groupOrder || [],
        image: item.image || "",
      }));

      console.log('localBasket at checkout:', localBasket);
      console.log('mappedItems to send:', mappedItems);

      const result = await createCheckoutSession({
        items: mappedItems,
        customerInfo,
        orderMethod: localOrderMethod,
        paymentMethod
      });

      if (!result) {
        throw new Error('No response received from payment processing');
      }

      if (paymentMethod === 'stripe') {
        if (!result.url) {
          throw new Error('No Stripe checkout URL received');
        }
        window.location.href = result.url;
      } else if (paymentMethod === 'cash') {
        if (!result.orderDetails) {
          throw new Error('No order details received for cash payment');
        }
        navigate('/payment/success', { 
          state: { 
            orderDetails: result.orderDetails,
            customerInfo,
            paymentMethod: 'cash'
          }
        });
      } else {
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    } catch (error) {
      console.error('=== Checkout Error ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      
      setFormErrors({ 
        submit: error.message || 'Failed to process order. Please try again.' 
      });
      setIsProcessing(false);
    }
  };

  const validateCoupon = async (code) => {
    if (!code.trim()) {
      setCouponError(translations[language].enterCouponCode);
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError('');

    try {
      const response = await fetch(`${getBaseUrl()}/api/coupons/validate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          email: formData.email,
          basket: localBasket
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || translations[language].invalidCoupon);
      }

      // Apply coupon to basket
      const discountRatio = data.DiscountRatio;
      const updatedBasket = localBasket.map(item => ({
        ...item,
        originalPrice: item.originalPrice || item.price, // Store original price
        discountedPrice: (item.originalPrice || item.price) * (1 - discountRatio),
        discountPercentage: discountRatio * 100
      }));

      setBasket(updatedBasket);
      setAppliedCoupon(data);
      setCouponCode('');
      setShowCouponSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowCouponSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError("Failed to apply coupon");
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    const updatedBasket = localBasket.map(item => ({
      ...item,
      discountedPrice: undefined,
      discountPercentage: undefined
    }));
    setBasket(updatedBasket);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const toggleItemDetails = (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Helper to group selected items by type
  const groupOptionsByType = (selectedItems) => {
    if (!selectedItems) return {};
    const groups = {};
    selectedItems.forEach(option => {
      const type = option.type || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(option);
    });
    return groups;
  };

  const OrderSummaryItem = ({ item }) => {
    const [showDetails, setShowDetails] = useState(false);

    const toggleDetails = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setShowDetails(!showDetails);
    };

    // Ensure we have valid numbers for prices
    const originalPrice = Number(item.originalPrice) || 0;
    const discountedPrice = Number(item.discountedPrice) || originalPrice;
    const quantity = Number(item.quantity) || 1;
    const hasDiscount = discountedPrice < originalPrice;

    return (
      <div className="flex justify-between items-start py-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.name} x{quantity}</span>
            <button
              onClick={(e) => toggleItemDetails(e, item.id)}
              className="info-btn px-2 py-1 text-xs rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {showDetails ? 'Hide Info' : 'Info'}
            </button>
          </div>
          {showDetails && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {item.selectedItems && item.selectedItems.length > 0 && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Options:</span>
                  <div className="mt-1 space-y-1">
                    {/* Display groups in the order of item.groupOrder, then any remaining groups */}
                    {item.groupOrder && item.groupOrder.length > 0 && (() => {
                      const groupMap = groupOptionsByGroupNameWithOrder(item.selectedItems);
                      const renderedGroups = new Set();
                      return [
                        ...item.groupOrder.filter(groupName => groupMap[groupName]).map(groupName => {
                          renderedGroups.add(groupName);
                          const group = groupMap[groupName];
                          return (
                            <div key={groupName} className="pl-2">
                              <span className="font-semibold text-gray-600 dark:text-gray-300">{group.name}:</span>{' '}
                              {group.options.map((opt, i, arr) => (
                                <span key={i}>
                                  {opt.name}{opt.quantity > 1 ? ` x${opt.quantity}` : ''}{i < arr.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          );
                        }),
                        // Render any remaining groups not in groupOrder
                        ...Object.entries(groupMap)
                          .filter(([groupName]) => !renderedGroups.has(groupName))
                          .map(([groupName, group]) => (
                            <div key={groupName} className="pl-2">
                              <span className="font-semibold text-gray-600 dark:text-gray-300">{group.name}:</span>{' '}
                              {group.options.map((opt, i, arr) => (
                                <span key={i}>
                                  {opt.name}{opt.quantity > 1 ? ` x${opt.quantity}` : ''}{i < arr.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          ))
                      ];
                    })()}
                    {/* Fallback if no groupOrder: show all groups sorted by displayOrder then name */}
                    {(!item.groupOrder || item.groupOrder.length === 0) && Object.values(groupOptionsByGroupNameWithOrder(item.selectedItems)).sort((a, b) => {
                      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
                      return a.name.localeCompare(b.name);
                    }).map(group => (
                      <div key={group.name} className="pl-2">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">{group.name}:</span>{' '}
                        {group.options.map((opt, i, arr) => (
                          <span key={i}>
                            {opt.name}{opt.quantity > 1 ? ` x${opt.quantity}` : ''}{i < arr.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {item.note && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Note:</span>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
                    {item.note}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          {hasDiscount ? (
            <>
              <span className="text-sm text-gray-500 line-through mr-2">
                €{(originalPrice * quantity).toFixed(2)}
              </span>
              <span className="font-medium text-green-600 dark:text-green-400">
                €{(discountedPrice * quantity).toFixed(2)}
              </span>
            </>
          ) : (
            <span className="font-medium">
              €{(originalPrice * quantity).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Calculate totals with discount
  const totalOriginalPrice = localBasket.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  const subtotal = localBasket.reduce((sum, item) => {
    const price = item.discountedPrice !== undefined ? item.discountedPrice : item.originalPrice;
    return sum + (price * item.quantity);
  }, 0);
  const totalDiscount = totalOriginalPrice - subtotal;

  return (
    <ApiProvider>
      <OrderProvider>
        <div className="checkout-container">
          <div className="checkout-form-container">
            <div className="flex items-center mb-6">
              <button
                onClick={handleBackToOrder}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {translations[language].backToOrder || "Back to Order"}
              </button>
            </div>

            <h2>{translations[language].checkout.title || "Checkout"}</h2>

            <form 
              className="checkout-form" 
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="form-section-group">
                <div className="form-section contact-fields">
                  <div className="input-row">
                    <div className="input-container h-[72px]">
                      <input
                        name="firstName"
                        placeholder={translations[language].firstName}
                        type="text"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        ref={firstNameRef}
                        className={`w-full ${formErrors.firstName ? 'error' : ''}`}
                      />
                    </div>
                    <div className="input-container h-[72px]">
                      <input
                        name="lastName"
                        placeholder={translations[language].lastName}
                        type="text"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        ref={lastNameRef}
                        className={`w-full ${formErrors.lastName ? 'error' : ''}`}
                      />
                    </div>
                  </div>
                  <div className="input-row">
                    <div className="input-container h-[72px]">
                      <input
                        name="email"
                        placeholder={translations[language].email}
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        ref={emailRef}
                        className={`w-full ${formErrors.email ? 'error' : ''}`}
                      />
                    </div>
                    <div className="input-container h-[72px]">
                      <input
                        name="phone"
                        placeholder={translations[language].phone}
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        ref={phoneRef}
                        className={`w-full ${formErrors.phone ? 'error' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {localOrderMethod === 'delivery' && (
                  <div className="form-section address-fields">
                    <PostalCodeSelector
                      onPostalCodeChange={(postalCode) => {
                        setFormData(prev => ({
                          ...prev,
                          postalCode
                        }));
                        // Clear postal code warning and highlight when selected
                        if (postalCode) {
                          setFormErrors(prev => ({
                            ...prev,
                            postalCodeWarning: undefined
                          }));
                          if (postalCodeRef.current) {
                            postalCodeRef.current.classList.remove('highlight-error');
                          }
                        }
                      }}
                      onAddressChange={(address) => {
                        setFormData(prev => ({
                          ...prev,
                          ...address
                        }));
                        // Clear address warning and highlight when selected
                        if (address.street) {
                          setFormErrors(prev => ({
                            ...prev,
                            addressWarning: undefined
                          }));
                          if (addressRef.current) {
                            addressRef.current.classList.remove('highlight-error');
                          }
                        }
                      }}
                      refs={{
                        postalCode: postalCodeRef,
                        address: addressRef,
                        house: houseRef
                      }}
                    />
                    {/* Display warnings */}
                    {formErrors.postalCodeWarning && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {formErrors.postalCodeWarning}
                      </div>
                    )}
                    {formErrors.addressWarning && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {formErrors.addressWarning}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-section-group">
                <label htmlFor="specialNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {translations[language].specialNotes || "Special Notes (Optional)"}
                </label>
                <textarea
                  id="specialNotes"
                  name="specialNotes"
                  placeholder={translations[language].specialNotesPlaceholder || "Enter any special delivery instructions or additional information..."}
                  value={formData.specialNotes}
                  onChange={handleInputChange}
                  rows="2"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Order Summary */}
              <div className="form-section-group mb-6">
                <h3 className="text-lg font-semibold mb-4">{translations[language].orderSummary}</h3>
                <div className="space-y-4">
                  {localBasket.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name} x{item.quantity}</span>
                          <button
                            onClick={(e) => toggleItemDetails(e, index)}
                            className="info-btn px-2 py-1 text-xs rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            {expandedItems[index] ? 'Hide Info' : 'Info'}
                          </button>
                        </div>
                        {expandedItems[index] && (
                          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            {item.selectedItems && item.selectedItems.length > 0 && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Options:</span>
                                <div className="mt-1 space-y-1">
                                  {/* Display groups in the order of item.groupOrder, then any remaining groups */}
                                  {item.groupOrder && item.groupOrder.length > 0 && (() => {
                                    const groupMap = groupOptionsByGroupNameWithOrder(item.selectedItems);
                                    const renderedGroups = new Set();
                                    return [
                                      ...item.groupOrder.filter(groupName => groupMap[groupName]).map(groupName => {
                                        renderedGroups.add(groupName);
                                        const group = groupMap[groupName];
                                        return (
                                          <div key={groupName} className="pl-2">
                                            <span className="font-semibold text-gray-600 dark:text-gray-300">{group.name}:</span>{' '}
                                            {group.options.map((opt, i, arr) => (
                                              <span key={i}>
                                                {opt.name}{opt.quantity > 1 ? ` x${opt.quantity}` : ''}{i < arr.length - 1 ? ', ' : ''}
                                              </span>
                                            ))}
                                          </div>
                                        );
                                      }),
                                      // Render any remaining groups not in groupOrder
                                      ...Object.entries(groupMap)
                                        .filter(([groupName]) => !renderedGroups.has(groupName))
                                        .map(([groupName, group]) => (
                                          <div key={groupName} className="pl-2">
                                            <span className="font-semibold text-gray-600 dark:text-gray-300">{group.name}:</span>{' '}
                                            {group.options.map((opt, i, arr) => (
                                              <span key={i}>
                                                {opt.name}{opt.quantity > 1 ? ` x${opt.quantity}` : ''}{i < arr.length - 1 ? ', ' : ''}
                                              </span>
                                            ))}
                                          </div>
                                        ))
                                    ];
                                  })()}
                                  {/* Fallback if no groupOrder: show all groups sorted by displayOrder then name */}
                                  {(!item.groupOrder || item.groupOrder.length === 0) && Object.values(groupOptionsByGroupNameWithOrder(item.selectedItems)).sort((a, b) => {
                                    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
                                    return a.name.localeCompare(b.name);
                                  }).map(group => (
                                    <div key={group.name} className="pl-2">
                                      <span className="font-semibold text-gray-600 dark:text-gray-300">{group.name}:</span>{' '}
                                      {group.options.map((opt, i, arr) => (
                                        <span key={i}>
                                          {opt.name}{opt.quantity > 1 ? ` x${opt.quantity}` : ''}{i < arr.length - 1 ? ', ' : ''}
                                        </span>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.note && (
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Note:</span>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
                                  {item.note}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {item.discountedPrice ? (
                          <div className="flex flex-col items-end">
                            <span className="text-sm text-gray-500 line-through">€{(item.originalPrice * item.quantity).toFixed(2)}</span>
                            <span className="text-green-600 dark:text-green-400">€{(item.discountedPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span>€{(item.originalPrice * item.quantity).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon Section */}
              <div className="form-section-group mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder={appliedCoupon ? "Coupon already applied" : (translations[language].enterCouponCode || "Enter coupon code")}
                        className={`flex-1 h-[42px] px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white ${
                          appliedCoupon ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''
                        }`}
                        disabled={!!appliedCoupon || isValidatingCoupon}
                      />
                      <button
                        type="button"
                        onClick={() => validateCoupon(couponCode)}
                        disabled={isValidatingCoupon || !couponCode.trim() || !!appliedCoupon}
                        className="h-[42px] px-6 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                      >
                        {isValidatingCoupon ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {translations[language].validating || "Validating..."}
                          </div>
                        ) : (
                          translations[language].apply || "Apply"
                        )}
                      </button>
                    </div>
                    {couponError && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{couponError}</p>
                    )}
                    {showCouponSuccess && (
                      <div className="mt-1">
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Coupon applied successfully!
                        </p>
                        <CouponScheduleInfo schedule={appliedCoupon?.schedule} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Update minimum order value display with ref and highlight effect */}
              {localOrderMethod === 'delivery' && formData.postalCode && minimumOrderValue > 0 && (
                <div className="form-section-group mb-6" ref={minimumOrderRef}>
                  <div className={`p-4 rounded-lg transition-all duration-300 ${
                    calculateOriginalBasketTotal() < minimumOrderValue 
                      ? 'bg-red-50 dark:bg-red-900/20' 
                      : 'bg-yellow-50 dark:bg-yellow-900/20'
                  } ${highlightMinimumOrder ? 'border-2 border-red-500' : 'border-2 border-transparent'}`}>
                    <p className={`${
                      calculateOriginalBasketTotal() < minimumOrderValue 
                        ? 'text-red-800 dark:text-red-200' 
                        : 'text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {translations[language].minimumOrderValue || "Minimum order value"}: €{minimumOrderValue.toFixed(2)}
                      {calculateOriginalBasketTotal() < minimumOrderValue && (
                        <span className="block mt-1">
                          {translations[language].minimumOrderNotMet || "Add more items to meet the minimum order value"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="form-section-group mb-6">
                <h3 className="text-lg font-semibold mb-4">{translations[language].paymentMethod || "Payment Method"}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label 
                    className={`relative block p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      paymentMethod === 'stripe' 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-red-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium">Credit Card</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Pay with Stripe</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Secure
                      </div>
                    </div>
                  </label>

                  <label 
                    className={`relative block p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      paymentMethod === 'cash' 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-red-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium">Cash</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Pay on delivery</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Easy
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Basket Summary */}
              <div className="basket-summary-container no-shadow">
                <BasketSummary
                  basket={localBasket}
                  translations={translations}
                  language={language}
                />
              </div>

              {/* Terms and Conditions */}
              <div className="form-section-group mb-6">
                <div className="terms-conditions">
                  <label className="terms-label">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span>
                      {translations[language].agreeToTerms || "I agree to the "}
                      <a href="/terms" target="_blank" rel="noopener noreferrer">
                        terms and conditions
                      </a>
                      .
                    </span>
                  </label>
                </div>
              </div>

              {/* Order Total */}
              <div className="form-section-group">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>{translations[language].total}:</span>
                  <div className="flex flex-col items-end">
                    {totalDiscount > 0 && (
                      <>
                        <span className="text-sm text-gray-500 line-through">€{totalOriginalPrice.toFixed(2)}</span>
                        <span className="text-green-600 dark:text-green-400">€{subtotal.toFixed(2)}</span>
                      </>
                    )}
                    {totalDiscount === 0 && (
                      <span className="text-red-600">€{subtotal.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Order Button */}
              <button
                type="submit"
                disabled={!termsAccepted || isSubmitting}
                className={`w-full py-4 rounded-md text-lg font-bold transition border-2 ${
                  !termsAccepted || isSubmitting
                    ? "submit-button disabled"
                    : "submit-button"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {translations[language].processing || "Processing..."}
                  </div>
                ) : (
                  translations[language].completeOrder || "Complete Order"
                )}
              </button>
            </form>
          </div>
        </div>
      </OrderProvider>
    </ApiProvider>
  );
};

export default Checkout;
