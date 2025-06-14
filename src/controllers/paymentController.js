import axios from 'axios';

// Configure axios defaults
axios.defaults.withCredentials = true;

// Helper function to construct full API URLs
export const getBaseUrl = () => {
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5019';
  }
  // In production, use the API URL from environment variable
  return process.env.REACT_APP_API_URL || 'https://restapi-m5th.onrender.com';
};

// Centralized API endpoint configuration
const API_ENDPOINTS = {
  STRIPE: {
    CREATE_CHECKOUT: '/api/Stripe/create-checkout-session',
    PAYMENT_SUCCESS: '/api/Stripe/payment-success',
    PAYMENT_CANCEL: '/api/Stripe/payment-cancel'
  },
  ORDER: {
    CREATE_CASH: '/api/Order/create-cash-order'
  },
  POSTCODE: {
    GET_MINIMUM_ORDER: '/api/PostcodeMinimumOrder/GetMinimumOrderValue'
  }
};

// Helper function to construct full API URLs
const getApiUrl = (endpoint) => {
  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${endpoint}`;
  console.log('Constructed API URL:', fullUrl);
  return fullUrl;
};

export const createCashOrder = async ({ items, customerInfo, orderMethod }) => {
  try {
    console.log('=== Creating Cash Order ===');
    console.log('Order Method:', orderMethod);
    console.log('Items:', JSON.stringify(items, null, 2));
    console.log('Customer Info:', JSON.stringify(customerInfo, null, 2));
    
    // Validate required fields
    if (!items || items.length === 0) {
      throw new Error('No items in the order');
    }

    if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
      throw new Error('Missing required customer information');
    }

    // Transform items to match backend expectations
    const transformedItems = items.map(item => ({
      Id: item.id,
      Name: item.name,
      Price: item.discountedPrice !== undefined ? item.discountedPrice : (item.originalPrice || item.price || 0),
      Quantity: item.quantity || 1,
      Notes: item.note || '',
      OriginalPrice: item.originalPrice || item.price || 0,
      SelectedItems: item.selectedItems?.map(selected => ({
        Id: selected.id,
        Name: selected.name,
        Price: selected.price || 0,
        Quantity: selected.quantity || 1,
        GroupName: selected.groupName || '',
        Type: selected.type || ''
      })) || [],
      GroupOrder: item.groupOrder || [],
      Image: item.image || ''
    }));

    // Calculate original total using the original prices and options
    const originalTotal = items.reduce((sum, item) => {
      return sum + item.originalPrice;
    }, 0);

    // Calculate current total (which may include discount)
    const totalAmount = items.reduce((sum, item) => {
      const itemPrice = item.discountedPrice !== undefined ? item.discountedPrice : item.originalPrice;
      // Price already includes quantity and options, so we just add it directly
      return sum + itemPrice;
    }, 0);

    // Check if any item has a discount applied
    const hasDiscount = items.some(item => 
      item.discountedPrice !== undefined && item.discountedPrice < (item.originalPrice || item.price)
    );

    console.log('Price calculations:', {
      originalTotal,
      totalAmount,
      hasDiscount,
      items: items.map(item => ({
        name: item.name,
        originalPrice: item.originalPrice,
        discountedPrice: item.discountedPrice,
        price: item.price,
        quantity: item.quantity
      }))
    });

    // Prepare the request payload
    const requestPayload = {
      items: transformedItems,
      customerInfo: {
        FirstName: customerInfo.firstName,
        LastName: customerInfo.lastName,
        Email: customerInfo.email,
        Phone: customerInfo.phone,
        PostalCode: customerInfo.postalCode,
        Street: customerInfo.street,
        House: customerInfo.house,
        Stairs: customerInfo.stairs,
        Stick: customerInfo.stick,
        Door: customerInfo.door,
        Bell: customerInfo.bell,
        SpecialNotes: customerInfo.specialNotes || customerInfo.comment || ''
      },
      orderMethod,
      paymentMethod: 'cash',
      status: 'pending',
      specialNotes: customerInfo.specialNotes || customerInfo.comment || '',
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      discountCoupon: hasDiscount ? 1 : 0
    };

    console.log('Sending request to API:', JSON.stringify(requestPayload, null, 2));
    console.log('API Endpoint:', getApiUrl(API_ENDPOINTS.ORDER.CREATE_CASH));

    // Send the order data
    const response = await axios.post(
      getApiUrl(API_ENDPOINTS.ORDER.CREATE_CASH),
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    if (!response.data) {
      throw new Error('No response data received from server');
    }

    // Store the order ID and full order details in localStorage for the success page
    if (response.data.OrderId) {
      localStorage.setItem('cashOrderId', response.data.OrderId);
      localStorage.setItem('paymentMethod', 'cash');
      localStorage.setItem('cashOrderDetails', JSON.stringify({
        ...response.data,
        Total: totalAmount,
        total: totalAmount,
        OriginalTotal: originalTotal
      }));
    }

    // Map the order details to ensure all required fields are present
    const orderDetails = {
      // Map exact response fields
      OrderId: response.data.OrderId,
      OrderNumber: response.data.OrderNumber,
      Status: response.data.Status,
      Total: totalAmount,
      PaymentMethod: response.data.PaymentMethod,
      OrderMethod: response.data.OrderMethod,
      CreatedAt: response.data.CreatedAt,
      DiscountCoupon: response.data.DiscountCoupon,
      CustomerInfo: response.data.CustomerInfo,
      OriginalTotal: originalTotal,
      
      // Keep lowercase versions for backward compatibility
      orderId: response.data.OrderId,
      orderNumber: response.data.OrderNumber,
      status: response.data.Status,
      total: totalAmount,
      paymentMethod: response.data.PaymentMethod,
      orderMethod: response.data.OrderMethod,
      createdAt: response.data.CreatedAt,
      discountCoupon: response.data.DiscountCoupon,
      originalTotal: originalTotal,
      customerInfo: {
        firstName: response.data.CustomerInfo?.FirstName,
        lastName: response.data.CustomerInfo?.LastName,
        email: response.data.CustomerInfo?.Email,
        phone: response.data.CustomerInfo?.Phone,
        // Delivery information
        postalCode: response.data.CustomerInfo?.PostalCode,
        street: response.data.CustomerInfo?.Street,
        house: response.data.CustomerInfo?.House,
        stairs: response.data.CustomerInfo?.Stairs,
        stick: response.data.CustomerInfo?.Stick,
        door: response.data.CustomerInfo?.Door,
        bell: response.data.CustomerInfo?.Bell,
        specialNotes: response.data.CustomerInfo?.SpecialNotes || response.data.SpecialNotes
      },
      
      // Order items
      items: response.data.Items?.map(item => ({
        id: item.Id,
        name: item.Name,
        price: item.Price,
        originalPrice: item.OriginalPrice,
        quantity: item.Quantity,
        note: item.Note || '',
        selectedItems: item.SelectedItems?.map(selected => ({
          id: selected.Id,
          name: selected.Name,
          price: selected.Price || 0,
          quantity: selected.Quantity || 1,
          groupName: selected.GroupName || '',
          type: selected.Type || ''
        })) || []
      })) || []
    };

    console.log('Mapped order details:', orderDetails);
    return orderDetails;
  } catch (error) {
    console.error('=== Cash Order Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received. Request details:', error.request);
    }
    
    throw error;
  }
};

// Store checkout data for potential retry
export const storeCheckoutData = (data) => {
  const checkoutData = {
    items: data.items.map(item => ({
      ...item,
      originalPrice: item.originalPrice || item.price,
      price: item.price,
      basePrice: item.basePrice || (item.originalPrice / (item.quantity || 1)),
      note: item.note || "",
      selectedItems: (item.selectedItems || []).map(opt => ({
        ...opt,
        price: opt.price || 0
      }))
    })),
    customerInfo: data.customerInfo,
    orderMethod: data.orderMethod,
    paymentMethod: data.paymentMethod,
    totalAmount: data.totalAmount || data.items.reduce((sum, item) => {
      const price = item.price || 0;
      return sum + (price * item.quantity);
    }, 0),
    originalTotal: data.items.reduce((sum, item) => {
      const price = item.originalPrice || item.price;
      return sum + (price * item.quantity);
    }, 0)
  };
  localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
};

// Retrieve stored checkout data
export const getStoredCheckoutData = () => {
  const data = localStorage.getItem('checkoutData');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing stored checkout data:', e);
      return null;
    }
  }
  return null;
};

// Clear stored checkout data
export const clearStoredCheckoutData = () => {
  localStorage.removeItem('checkoutData');
};

export const createCheckoutSession = async ({ items, customerInfo, orderMethod, paymentMethod = 'stripe' }) => {
  try {
    console.log('=== Creating Checkout Session ===');
    console.log('Payment Method:', paymentMethod);
    console.log('Order Method:', orderMethod);
    console.log('API URL:', getApiUrl(API_ENDPOINTS.STRIPE.CREATE_CHECKOUT));
    console.log('Items:', JSON.stringify(items, null, 2));
    console.log('Customer Info:', JSON.stringify(customerInfo, null, 2));

    // Store checkout data for potential retry
    storeCheckoutData({ items, customerInfo, orderMethod, paymentMethod });

    // For cash payments, use the createCashOrder function
    if (paymentMethod === 'cash') {
      console.log('Processing cash payment...');
      try {
        const cashOrderResult = await createCashOrder({ items, customerInfo, orderMethod });
        console.log('Cash order result:', cashOrderResult);
        
        return {
          url: null,
          sessionId: cashOrderResult.orderId,
          orderDetails: {
            id: cashOrderResult.orderId,
            orderNumber: cashOrderResult.orderNumber,
            total: cashOrderResult.total,
            status: 'pending',
            paymentMethod: 'cash',
            orderMethod: orderMethod,
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
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
            }))
          }
        };
      } catch (error) {
        console.error('Error in createCashOrder:', error);
        throw error;
      }
    }

    // Validate required fields
    if (!items || items.length === 0) {
      throw new Error('No items in the order');
    }

    if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
      throw new Error('Missing required customer information');
    }

    // Transform items to match backend expectations
    const orderItems = items.map(item => ({
      Id: parseInt(item.id),
      Name: item.name,
      Price: item.discountedPrice !== undefined ? item.discountedPrice : (item.originalPrice || item.price || 0),
      OriginalPrice: item.originalPrice || item.price || 0,
      Quantity: item.quantity || 1,
      Note: item.note || "",
      SelectedItems: (item.selectedItems || []).map(opt => ({
        Id: opt.id,
        Name: opt.name,
        GroupName: opt.groupName,
        Type: opt.type,
        Price: opt.price || 0,
        Quantity: opt.quantity || 1,
      })),
      GroupOrder: item.groupOrder || [],
      Image: item.image || "",
    }));

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      const itemPrice = item.discountedPrice !== undefined ? item.discountedPrice : (item.originalPrice || item.price || 0);
      // Price already includes quantity and options, so we just add it directly
      return sum + itemPrice;
    }, 0);

    // Format customer info for API
    const customer = {
      FirstName: customerInfo.firstName,
      LastName: customerInfo.lastName,
      Email: customerInfo.email,
      Phone: customerInfo.phone,
      CreateDate: new Date().toISOString(),
      ...(orderMethod === 'delivery' && {
        PostalCode: customerInfo.postalCode,
        Street: customerInfo.street,
        House: customerInfo.house,
        Stairs: customerInfo.stairs || null,
        Stick: customerInfo.stick || null,
        Door: customerInfo.door || null,
        Bell: customerInfo.bell || null
      })
    };

    // Prepare the request payload
    const requestPayload = {
      items: orderItems,
      customerInfo: customer,
      orderMethod,
      paymentMethod,
      status: 'processing',
      specialNotes: customerInfo.specialNotes || null,
      totalAmount
    };

    console.log('Sending request to API:', JSON.stringify(requestPayload, null, 2));
    console.log('API Endpoint:', getApiUrl(API_ENDPOINTS.STRIPE.CREATE_CHECKOUT));

    // Send the order data
    const response = await axios.post(
      getApiUrl(API_ENDPOINTS.STRIPE.CREATE_CHECKOUT),
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
      }
    );

    console.log('Server response:', JSON.stringify(response.data, null, 2));

    if (!response.data) {
      throw new Error('No response data received from server');
    }

    // For Stripe payments, we expect a URL to redirect to
    if (paymentMethod === 'stripe' && !response.data.url) {
      throw new Error('No Stripe checkout URL received');
    }

    // Store the session ID in localStorage before redirecting
    if (paymentMethod === 'stripe' && response.data.sessionId) {
      localStorage.setItem('stripeSessionId', response.data.sessionId);
    }

    // Return the session URL and order details
    return {
      url: response.data.url,
      sessionId: response.data.sessionId,
      orderDetails: {
        id: response.data.orderId,
        orderNumber: response.data.orderNumber,
        total: totalAmount,
        status: 'processing',
        paymentMethod,
        orderMethod
      }
    };
  } catch (error) {
    console.error('=== Payment Controller Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received. Request details:', error.request);
    }
    
    throw error;
  }
};

export const handlePaymentSuccess = async (id) => {
  try {
    // Try to get session ID from URL parameters first, then localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get('session_id') || urlParams.get('sessionId');
    
    console.log('Session ID from URL:', sessionIdFromUrl);
    console.log('Session ID from props:', id);
    console.log('Session ID from localStorage:', localStorage.getItem('stripeSessionId'));
    
    // Use the session ID from URL if available, otherwise use the one passed as parameter
    const sessionIdToUse = sessionIdFromUrl || id;
    
    console.log('Using session ID:', sessionIdToUse);
    
    if (!sessionIdToUse) {
      console.error('No session ID available');
      throw new Error('No session ID available');
    }

    const apiUrl = getApiUrl(API_ENDPOINTS.STRIPE.PAYMENT_SUCCESS);
    const fullUrl = `${apiUrl}?session_id=${encodeURIComponent(sessionIdToUse)}`;
    console.log('Making request to:', fullUrl);

    // Call the backend to verify the payment and get order details
    const response = await axios.get(fullUrl);
    console.log('Payment success response:', response.data);

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    // Clear the stored session ID
    localStorage.removeItem('stripeSessionId');

    // Clear stored checkout data on successful payment
    clearStoredCheckoutData();

    // Calculate total amount from items
    const totalAmount = response.data.Items?.reduce((sum, item) => {
      const itemPrice = item.Price || 0;
      return sum + itemPrice;
    }, 0) || 0;

    // Calculate original total
    const originalTotal = response.data.Items?.reduce((sum, item) => {
      const itemPrice = item.OriginalPrice || item.Price || 0;
      return sum + itemPrice;
    }, 0) || 0;

    // Map the order details to ensure all required fields are present
    const orderDetails = {
      // Map exact response fields
      OrderId: response.data.OrderId,
      OrderNumber: response.data.OrderNumber,
      Status: response.data.Status,
      Total: totalAmount,
      PaymentMethod: response.data.PaymentMethod,
      OrderMethod: response.data.OrderMethod,
      CreatedAt: response.data.CreatedAt,
      DiscountCoupon: response.data.DiscountCoupon,
      CustomerInfo: response.data.CustomerInfo,
      OriginalTotal: originalTotal,
      
      // Keep lowercase versions for backward compatibility
      orderId: response.data.OrderId,
      orderNumber: response.data.OrderNumber,
      status: response.data.Status,
      total: totalAmount,
      paymentMethod: response.data.PaymentMethod,
      orderMethod: response.data.OrderMethod,
      createdAt: response.data.CreatedAt,
      discountCoupon: response.data.DiscountCoupon,
      originalTotal: originalTotal,
      customerInfo: {
        firstName: response.data.CustomerInfo?.FirstName,
        lastName: response.data.CustomerInfo?.LastName,
        email: response.data.CustomerInfo?.Email,
        phone: response.data.CustomerInfo?.Phone,
        // Delivery information
        postalCode: response.data.CustomerInfo?.PostalCode,
        street: response.data.CustomerInfo?.Street,
        house: response.data.CustomerInfo?.House,
        stairs: response.data.CustomerInfo?.Stairs,
        stick: response.data.CustomerInfo?.Stick,
        door: response.data.CustomerInfo?.Door,
        bell: response.data.CustomerInfo?.Bell,
        specialNotes: response.data.CustomerInfo?.SpecialNotes || response.data.SpecialNotes
      },
      
      // Order items
      items: response.data.Items?.map(item => {
        // Parse SelectedItems if it's a string
        let selectedItems = item.SelectedItems;
        if (typeof selectedItems === 'string') {
          try {
            selectedItems = JSON.parse(selectedItems);
          } catch (e) {
            console.error('Error parsing SelectedItems:', e);
            selectedItems = [];
          }
        }

        return {
          id: item.Id,
          name: item.Name,
          price: item.Price,
          originalPrice: item.OriginalPrice,
          quantity: item.Quantity,
          note: item.Note || '',
          selectedItems: selectedItems?.map(selected => ({
            id: selected.id || selected.Id,
            name: selected.name || selected.Name,
            price: selected.price || selected.Price || 0,
            quantity: selected.quantity || selected.Quantity || 1,
            groupName: selected.groupName || selected.GroupName || '',
            type: selected.type || selected.Type || ''
          })) || []
        };
      }) || []
    };

    console.log('Mapped order details:', orderDetails);
    return orderDetails;
  } catch (error) {
    console.error('=== Payment Success Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    }
    
    throw error;
  }
};

export const handlePaymentCancel = async (sessionId) => {
  try {
    // Try to get session ID from URL parameters first, then localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get('session_id') || urlParams.get('sessionId');
    const sessionIdToUse = sessionIdFromUrl || sessionId || localStorage.getItem('stripeSessionId');
    
    console.log('Session ID from URL:', sessionIdFromUrl);
    console.log('Session ID from props:', sessionId);
    console.log('Session ID from localStorage:', localStorage.getItem('stripeSessionId'));
    console.log('Using session ID:', sessionIdToUse);
    
    if (!sessionIdToUse) {
      console.error('No session ID available from any source');
      throw new Error('No session ID available');
    }

    const apiUrl = getApiUrl(API_ENDPOINTS.STRIPE.PAYMENT_CANCEL);
    const fullUrl = `${apiUrl}?session_id=${encodeURIComponent(sessionIdToUse)}`;
    console.log('Making cancel request to:', fullUrl);
    
    // Make a GET request with the session ID as a query parameter
    const response = await axios.get(fullUrl);
    console.log('Payment cancel response:', response.data);
    
    localStorage.removeItem('stripeSessionId');
    return true;
  } catch (error) {
    console.error('=== Payment Cancel Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received. Request details:', error.request);
    }
    
    throw error;
  }
};

export const getMinimumOrderValue = async (postcode) => {
  try {
    const response = await axios.get(
      `${getApiUrl(API_ENDPOINTS.POSTCODE.GET_MINIMUM_ORDER)}/${postcode}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching minimum order value:', error);
    return 0;
  }
};

// Function to clear all stored data when starting a new order
export const clearAllStoredData = () => {
  localStorage.removeItem('stripeSessionId');
  clearStoredCheckoutData();
  localStorage.removeItem('basket');
}; 