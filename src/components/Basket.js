import { useNavigate, useLocation } from "react-router-dom";
import { FaceFrownIcon } from "@heroicons/react/24/solid";
import { TrashIcon } from "@heroicons/react/24/outline";
import '../Basket.css';
import '../colors/basketColors.css';
import { useState, useEffect, useRef } from "react";
import '../colors/orderColors.css';

function groupOptionsByGroupNameWithOrder(selectedItems) {
  if (!selectedItems) return [];
  // Collect unique groupNames with their displayOrder (if present)
  const groupMap = {};
  selectedItems.forEach(option => {
    const groupName = option.groupName || 'Other';
    if (!groupMap[groupName]) {
      groupMap[groupName] = {
        name: groupName,
        displayOrder: option.groupDisplayOrder ?? option.displayOrder ?? 9999, // fallback if not present
        options: []
      };
    }
    groupMap[groupName].options.push(option);
  });
  return groupMap;
}

const BasketItem = ({ item, onRemove, increaseQuantity, decreaseQuantity, index, translations, language, isLastItem }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleIncrease = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await increaseQuantity(index);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrease = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await decreaseQuantity(index);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove();
  };

  const toggleDetails = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  // Calculate the total price for this item
  // originalPrice already includes both options and quantity
  const totalPrice = Number(item.originalPrice) || 0;

  return (
    <li className="basket-item">
      <div className="basket-item-header">
        <div className="flex items-center gap-2">
          <span className="basket-item-name">{item.name}</span>
          <button
            onClick={toggleDetails}
            className="info-btn px-2 py-1 text-xs rounded-full border border-[var(--basket-container-border)] hover:bg-[var(--basket-button-hover)] transition-colors"
          >
            {showDetails ? translations[language].hideInfo : translations[language].info}
          </button>
        </div>
        <div className="basket-item-controls">
          <button
            onClick={handleDecrease}
            className="quantity-btn bg-[var(--basket-button-bg)] hover:bg-[var(--basket-button-hover)]"
            aria-label="Decrease quantity"
            disabled={item.quantity <= 1 || isProcessing}
          >
            -
          </button>
          <span className="quantity-display">{item.quantity}</span>
          <button
            onClick={handleIncrease}
            className="quantity-btn bg-[var(--basket-button-bg)] hover:bg-[var(--basket-button-hover)]"
            aria-label="Increase quantity"
            disabled={isProcessing}
          >
            +
          </button>
          <button
            onClick={handleRemove}
            className="remove-btn"
            aria-label="Remove item"
          >
            <TrashIcon className="w-7 h-7" />
          </button>
        </div>
      </div>
      <div className="basket-item-price text-[var(--basket-item-price)]">
        <span>€{totalPrice.toFixed(2)}</span>
      </div>
      {showDetails && (
        <div className="mt-2 p-3 bg-[var(--basket-container-bg)] rounded-lg">
          {item.selectedItems && item.selectedItems.length > 0 && (
            <div className="mb-2">
              <span className="text-sm font-medium text-[var(--basket-item-text)]">{translations[language].selectedOptions}:</span>
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
                          <span className="font-semibold text-[var(--basket-item-text)]">{group.name}:</span>{' '}
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
                          <span className="font-semibold text-[var(--basket-item-text)]">{group.name}:</span>{' '}
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
                    <span className="font-semibold text-[var(--basket-item-text)]">{group.name}:</span>{' '}
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
              <span className="text-sm font-medium text-[var(--basket-item-text)]">{translations[language].note}:</span>
              <p className="mt-1 text-sm text-[var(--basket-item-text)] italic">
                {item.note}
              </p>
            </div>
          )}
        </div>
      )}
    </li>
  );
};

const Basket = ({
  basket,
  toggleQuantityVisibility,
  increaseQuantity,
  decreaseQuantity,
  removeFromBasket,
  confirmQuantity,
  translations,
  language,
  basketVisible,
  orderMethod,
  onOrderMethodChange,
  toggleBasket,
  setBasket
}) => {
  const navigate = useNavigate();
  const [showCouponWarning, setShowCouponWarning] = useState(false);
  const location = useLocation();
  const [previousBasketState, setPreviousBasketState] = useState(null);
  const warningShownRef = useRef(false);
  const basketRef = useRef(null);

  // Show coupon warning only when coming from checkout or when basket is modified
  useEffect(() => {
    // Show warning if coming from checkout
    if (location.state?.showCouponWarning) {
      setShowCouponWarning(true);
      const timer = setTimeout(() => {
        setShowCouponWarning(false);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Reset warning state when basket becomes empty
    if (basket.length === 0) {
      warningShownRef.current = false;
      setShowCouponWarning(false);
    }

    // Check if basket was modified (items added, removed, or quantities changed)
    if (previousBasketState && !warningShownRef.current) {
      const hadCoupon = previousBasketState.some(item => item.discountedPrice !== undefined);
      const hasCoupon = basket.some(item => item.discountedPrice !== undefined);
      const basketModified = JSON.stringify(previousBasketState) !== JSON.stringify(basket);
      
      if (hadCoupon && basketModified) {
        // Remove discounts from all items
        const updatedBasket = basket.map(item => ({
          ...item,
          discountedPrice: undefined,
          discountPercentage: undefined
        }));
        
        // Update the basket state
        if (typeof setBasket === 'function') {
          setBasket(updatedBasket);
        }
        
        // Update localStorage to persist the changes
        localStorage.setItem('basket', JSON.stringify(updatedBasket));
        
        setShowCouponWarning(true);
        warningShownRef.current = true;
        const timer = setTimeout(() => {
          setShowCouponWarning(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }

    setPreviousBasketState(basket);
  }, [basket, location.state, previousBasketState, setBasket]);

  // Set --vh CSS variable for mobile viewport height
  useEffect(() => {
    const setVh = () => {
      // Get the viewport height and multiply it by 1% to get a value for a vh unit
      const vh = window.innerHeight * 0.01;
      // Set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', `${vh}`);
    };

    // Initial set
    setVh();

    // Add event listener
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);

    // Cleanup
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  // Add effect to handle safe area insets
  useEffect(() => {
    const updateSafeAreaInsets = () => {
      const safeAreaBottom = window.visualViewport?.height 
        ? window.innerHeight - window.visualViewport.height + (window.visualViewport.offsetTop || 0)
        : 0;
      document.documentElement.style.setProperty('--safe-area-inset-bottom', `${safeAreaBottom}px`);
    };

    updateSafeAreaInsets();
    window.addEventListener('resize', updateSafeAreaInsets);
    window.addEventListener('orientationchange', updateSafeAreaInsets);

    return () => {
      window.removeEventListener('resize', updateSafeAreaInsets);
      window.removeEventListener('orientationchange', updateSafeAreaInsets);
    };
  }, []);

  const handleProceedToCheckout = () => {
    navigate('/checkout', { state: { basket, orderMethod } });
  };

  // Calculate total price by summing up each item's price
  const subtotal = basket.reduce((sum, item) => {
    // Use originalPrice directly since it already includes (item + options) * quantity
    const price = item.discountedPrice !== undefined ? item.discountedPrice : item.originalPrice;
    return sum + price;
  }, 0);

  // Calculate original total price (before any discounts)
  const totalOriginalPrice = basket.reduce((sum, item) => {
    // Use originalPrice directly since it already includes (item + options) * quantity
    return sum + item.originalPrice;
  }, 0);

  const totalDiscount = totalOriginalPrice - subtotal;

  return (
    <div
      ref={basketRef}
      className={`basket-panel transition-transform duration-300 bg-[var(--basket-container-bg)] border border-[var(--basket-container-border)] shadow-lg rounded-lg overflow-hidden flex flex-col ${
        basketVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        position: 'fixed',
        top: '96px',
        right: window.innerWidth <= 768 ? '0' : '1.5rem',
        width: window.innerWidth <= 768 ? '100%' : '28rem',
        height: `calc(100vh - 96px)`,
        zIndex: 1050
      }}
    >
      {/* Order Method Toggle */}
      <div className="order-toggle">
        <div className="toggle-wrapper-long" data-selected={orderMethod}>
          <button
            type="button"
            data-type="delivery"
            className={`toggle-option ${orderMethod === "delivery" ? "active" : ""}`}
            onClick={() => onOrderMethodChange("delivery")}
          >
            🚚 {translations[language].delivery}
          </button>
          <button
            type="button"
            data-type="pickup"
            className={`toggle-option ${orderMethod === "selfCollection" ? "active" : ""}`}
            onClick={() => onOrderMethodChange("selfCollection")}
          >
            🏃 {translations[language].selfCollection}
          </button>
        </div>
      </div>

      {/* Basket Header */}
      {basket.length > 0 && (
        <div className="basket-header">
          <h3>{translations[language].yourBasket}</h3>
        </div>
      )}

      {/* Basket Content */}
      <div className="basket-content flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        {basket.length === 0 ? (
          <div className="empty-basket">
            <div className="empty-basket-icon">
              <FaceFrownIcon className="w-12 h-12" />
            </div>
            <p>{translations[language].basketEmpty}</p>
          </div>
        ) : (
          <ul className="basket-items">
            {basket.map((item, index) => (
              <BasketItem
                key={index}
                item={item}
                onRemove={() => removeFromBasket(index)}
                increaseQuantity={() => increaseQuantity(index)}
                decreaseQuantity={() => decreaseQuantity(index)}
                index={index}
                translations={translations}
                language={language}
                isLastItem={index === basket.length - 1}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Basket Footer: Total and Checkout Button */}
      {basket.length > 0 && (
        <div className="basket-footer" style={{ padding: '0.5rem 1.5rem 1rem 1.5rem' }}>
          <div className="basket-total">
            {/* Coupon Warning Message */}
            <div 
              className={`mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg transition-all duration-500 ease-in-out transform ${
                showCouponWarning 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-4 h-0 overflow-hidden'
              }`}
            >
              <p className="text-yellow-700 dark:text-yellow-300 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {translations[language].basketUpdatedCouponRemoved}
              </p>
            </div>

            <div className="flex justify-between items-center" style={{ marginTop: '-0.75rem' }}>
              <span className="text-base font-semibold">
                {translations[language].total}:
              </span>
              <div className="text-right">
                {totalDiscount > 0 && (
                  <>
                    <span className="text-xs text-gray-500 line-through block">
                      €{totalOriginalPrice.toFixed(2)}
                    </span>
                    <span className="text-base font-bold text-green-600 dark:text-green-400">
                      €{subtotal.toFixed(2)}
                    </span>
                  </>
                )}
                {totalDiscount === 0 && (
                  <span className="text-base font-bold">
                    €{subtotal.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleProceedToCheckout}
            className={`w-full py-2 rounded-md text-base font-bold transition ${
              basket.length === 0
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-green-600"
            }`}
            disabled={basket.length === 0}
            style={{ flexShrink: 0, margin: '0.5rem 0 0 0' }}
          >
            {translations[language].proceedToCheckout}
          </button>
        </div>
      )}
    </div>
  );
};

export default Basket;

