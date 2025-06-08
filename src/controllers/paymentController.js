import axios from 'axios';

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
      const base = (item.originalPrice || item.price || 0) * (item.quantity || 1);
      const options = (item.selectedItems || []).reduce(
        (optSum, opt) => optSum + ((opt.price || 0) * (opt.quantity || 1)),
        0
      );
      return sum + base + options;
    }, 0);

    // Calculate current total (which may include discount)
    const totalAmount = items.reduce((sum, item) => {
      const itemPrice = item.discountedPrice !== undefined ? item.discountedPrice : (item.originalPrice || item.price || 0);
      const itemTotal = itemPrice * (item.quantity || 1);
      const selectedItemsTotal = (item.selectedItems || []).reduce((selectedSum, selected) => {
        return selectedSum + ((selected.price || 0) * (selected.quantity || 1));
      }, 0);
      return sum + itemTotal + selectedItemsTotal;
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
          'Content-Type': 'application/json',
        },
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
        OriginalTotal: originalTotal
      }));
    }

    // Map the order details to ensure all required fields are present
    const orderDetails = {
      // Map exact response fields
      OrderId: response.data.OrderId,
      OrderNumber: response.data.OrderNumber,
      Status: response.data.Status,
      Total: response.data.Total,
      PaymentMethod: response.data.PaymentMethod,
      OrderMethod: response.data.OrderMethod,
      CreatedAt: response.data.CreatedAt,
      DiscountCoupon: response.data.DiscountCoupon,
      CustomerInfo: response.data.CustomerInfo,
      
      // Keep lowercase versions for backward compatibility
      orderId: response.data.OrderId,
      orderNumber: response.data.OrderNumber,
      status: response.data.Status,
      total: response.data.Total,
      paymentMethod: response.data.PaymentMethod,
      orderMethod: response.data.OrderMethod,
      createdAt: response.data.CreatedAt,
      discountCoupon: response.data.DiscountCoupon,
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
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.discountedPrice !== undefined ? item.discountedPrice : (item.originalPrice || item.price || 0),
        quantity: item.quantity || 1,
        note: item.note || '',
        selectedItems: item.selectedItems?.map(selected => ({
          id: selected.id,
          name: selected.name,
          price: selected.price || 0,
          quantity: selected.quantity || 1,
          groupName: selected.groupName || '',
          type: selected.type || ''
        })) || []
      }))
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
    const orderItems = items.map(item => {
      const mappedItem = {
        Id: parseInt(item.id),
        Name: item.name,
        Price: item.price,
        Quantity: item.quantity,
        Note: item.note || "",
        SelectedItems: (item.selectedItems || []).map(opt => ({
          Id: opt.id,
          Name: opt.name,
          GroupName: opt.groupName,
          Type: opt.type,
          Price: opt.price,
          Quantity: opt.quantity,
        })),
        GroupOrder: item.groupOrder || [],
        Image: item.image || "",
      };
      console.log('Mapped item:', JSON.stringify(mappedItem, null, 2));
      return mappedItem;
    });

    // Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => {
      const itemTotal = item.Price * item.Quantity;
      const selectedItemsTotal = item.SelectedItems.reduce((itemSum, selectedItem) => 
        itemSum + (selectedItem.Price * selectedItem.Quantity), 0);
      return sum + itemTotal + selectedItemsTotal;
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
          'Content-Type': 'application/json',
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
    console.log('Handling payment success for ID:', id);
    
    // Get payment method from localStorage
    const paymentMethod = localStorage.getItem('paymentMethod') || 'stripe';
    console.log('Payment method:', paymentMethod);

    if (paymentMethod === 'cash') {
      // For cash payments, fetch order details directly
      const orderDetailsUrl = `${getBaseUrl()}/api/Order/${id}`;
      console.log('Fetching cash order details from:', orderDetailsUrl);
      
      const orderDetailsResponse = await axios.get(orderDetailsUrl);
      console.log('Raw response data:', orderDetailsResponse.data);

      if (!orderDetailsResponse.data) {
        throw new Error('Failed to fetch complete order details');
      }

      // Map the order details to ensure all required fields are present
      const orderDetails = {
        // Map exact response fields
        OrderId: orderDetailsResponse.data.OrderId,
        OrderNumber: orderDetailsResponse.data.OrderNumber,
        Status: orderDetailsResponse.data.Status,
        Total: orderDetailsResponse.data.Total,
        PaymentMethod: orderDetailsResponse.data.PaymentMethod,
        OrderMethod: orderDetailsResponse.data.OrderMethod,
        CreatedAt: orderDetailsResponse.data.CreatedAt,
        DiscountCoupon: orderDetailsResponse.data.DiscountCoupon,
        
        // Keep lowercase versions for backward compatibility
        orderId: orderDetailsResponse.data.OrderId,
        orderNumber: orderDetailsResponse.data.OrderNumber,
        status: orderDetailsResponse.data.Status,
        total: orderDetailsResponse.data.Total,
        paymentMethod: orderDetailsResponse.data.PaymentMethod,
        orderMethod: orderDetailsResponse.data.OrderMethod,
        createdAt: orderDetailsResponse.data.CreatedAt,
        discountCoupon: orderDetailsResponse.data.DiscountCoupon,
        
        // Customer information - updated to use the correct property path
        CustomerInfo: orderDetailsResponse.data.CustomerInfo,
        customerInfo: {
          firstName: orderDetailsResponse.data.CustomerInfo?.FirstName,
          lastName: orderDetailsResponse.data.CustomerInfo?.LastName,
          email: orderDetailsResponse.data.CustomerInfo?.Email,
          phone: orderDetailsResponse.data.CustomerInfo?.Phone,
          // Delivery information
          postalCode: orderDetailsResponse.data.CustomerInfo?.PostalCode,
          street: orderDetailsResponse.data.CustomerInfo?.Street,
          house: orderDetailsResponse.data.CustomerInfo?.House,
          stairs: orderDetailsResponse.data.CustomerInfo?.Stairs,
          stick: orderDetailsResponse.data.CustomerInfo?.Stick,
          door: orderDetailsResponse.data.CustomerInfo?.Door,
          bell: orderDetailsResponse.data.CustomerInfo?.Bell,
          specialNotes: orderDetailsResponse.data.CustomerInfo?.SpecialNotes || orderDetailsResponse.data.SpecialNotes
        },
        
        // Order items
        items: orderDetailsResponse.data.items?.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          note: item.note,
          selectedItems: item.selectedItems?.map(selected => ({
            id: selected.id,
            name: selected.name,
            price: selected.price,
            quantity: selected.quantity || 1,
            groupName: selected.groupName,
            type: selected.type
          })) || []
        })) || []
      };

      console.log('Mapped order details:', orderDetails);
      return orderDetails;
    }

    // For Stripe payments, continue with session ID logic
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get('session_id');
    
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

    // Call the backend to verify the payment
    const response = await axios.get(fullUrl);
    console.log('Payment success response:', response.data);

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    // Get the order ID from the response
    const orderId = response.data.orderId;
    if (!orderId) {
      throw new Error('No order ID in response');
    }

    // Fetch complete order details
    const orderDetailsUrl = `${getBaseUrl()}/api/Order/get-order/${orderId}`;
    console.log('Fetching complete order details from:', orderDetailsUrl);
    
    const orderDetailsResponse = await axios.get(orderDetailsUrl);
    console.log('Raw response data:', orderDetailsResponse.data);

    if (!orderDetailsResponse.data) {
      throw new Error('Failed to fetch complete order details');
    }

    // Clear the stored session ID
    localStorage.removeItem('stripeSessionId');

    // Clear stored checkout data on successful payment
    clearStoredCheckoutData();

    // Get the stored checkout data to check for discounts
    const storedCheckoutData = localStorage.getItem('checkoutData');
    const checkoutData = storedCheckoutData ? JSON.parse(storedCheckoutData) : null;
    console.log('Stored checkout data:', checkoutData);

    // Calculate original total from items
    const originalTotal = orderDetailsResponse.data.items?.reduce((sum, item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      const selectedItemsTotal = (item.selectedItems || []).reduce((selectedSum, selected) => 
        selectedSum + ((selected.price || 0) * (selected.quantity || 1)), 0);
      return sum + itemTotal + selectedItemsTotal;
    }, 0) || 0;

    // Map the order details to ensure all required fields are present
    const orderDetails = {
      // Map exact response fields
      OrderId: orderDetailsResponse.data.OrderId,
      OrderNumber: orderDetailsResponse.data.OrderNumber,
      Status: orderDetailsResponse.data.Status,
      Total: orderDetailsResponse.data.Total,
      PaymentMethod: orderDetailsResponse.data.PaymentMethod,
      OrderMethod: orderDetailsResponse.data.OrderMethod,
      CreatedAt: orderDetailsResponse.data.CreatedAt,
      DiscountCoupon: orderDetailsResponse.data.DiscountCoupon,
      CustomerInfo: orderDetailsResponse.data.CustomerInfo,
      
      // Keep lowercase versions for backward compatibility
      orderId: orderDetailsResponse.data.OrderId,
      orderNumber: orderDetailsResponse.data.OrderNumber,
      status: orderDetailsResponse.data.Status,
      total: orderDetailsResponse.data.Total,
      paymentMethod: orderDetailsResponse.data.PaymentMethod,
      orderMethod: orderDetailsResponse.data.OrderMethod,
      createdAt: orderDetailsResponse.data.CreatedAt,
      discountCoupon: orderDetailsResponse.data.DiscountCoupon,
      customerInfo: {
        firstName: orderDetailsResponse.data.CustomerInfo?.FirstName,
        lastName: orderDetailsResponse.data.CustomerInfo?.LastName,
        email: orderDetailsResponse.data.CustomerInfo?.Email,
        phone: orderDetailsResponse.data.CustomerInfo?.Phone,
        // Delivery information
        postalCode: orderDetailsResponse.data.CustomerInfo?.PostalCode,
        street: orderDetailsResponse.data.CustomerInfo?.Street,
        house: orderDetailsResponse.data.CustomerInfo?.House,
        stairs: orderDetailsResponse.data.CustomerInfo?.Stairs,
        stick: orderDetailsResponse.data.CustomerInfo?.Stick,
        door: orderDetailsResponse.data.CustomerInfo?.Door,
        bell: orderDetailsResponse.data.CustomerInfo?.Bell,
        specialNotes: orderDetailsResponse.data.CustomerInfo?.SpecialNotes || orderDetailsResponse.data.SpecialNotes
      },
      
      // Order items
      items: orderDetailsResponse.data.items?.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: item.note,
        selectedItems: item.selectedItems?.map(selected => ({
          id: selected.id,
          name: selected.name,
          price: selected.price,
          quantity: selected.quantity || 1,
          groupName: selected.groupName,
          type: selected.type
        })) || []
      })) || []
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