import React, { useState, useEffect } from 'react';
import '../colors/popupIngredientsColors.css';

const PopupIngredients = ({ item, onClose, onAddToBasket }) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleFocus = () => {
      setIsKeyboardVisible(true);
    };

    const handleBlur = () => {
      setIsKeyboardVisible(false);
    };

    // Add event listeners to all input and textarea elements
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
    });

    return () => {
      // Clean up event listeners
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      });
    };
  }, []);

  return (
    <div className={`ingredient-popup ${isKeyboardVisible ? 'keyboard-visible' : ''}`}>
      <div className="popup-container">
        {item.image_url && (
          <div className="relative w-full h-[300px] flex-shrink-0">
            <img
              src={item.image_url}
              alt={item.name || 'Item'}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-11 h-11 min-w-[44px] min-h-[44px] bg-[var(--popup-close-button-bg)] text-[var(--popup-close-button-text)] hover:text-[var(--popup-close-button-hover-text)] rounded-full border border-[var(--popup-close-button-border)] flex items-center justify-center shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="popup-content">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-[var(--popup-header-text)] mb-2 text-left">
              {item.name || 'Unnamed Item'}
            </h2>
            <div className="flex items-center mb-1">
              <span className="text-lg font-bold text-red-500" style={{ textAlign: 'left' }}>
                €{item.price}
              </span>
            </div>
            <p className="text-[var(--popup-content-text)] mb-4 text-left">
              {item.description || 'No description available'}
            </p>

            <hr className="border-[var(--popup-content-border)] mb-4" />

            <div className="ingredient-list">
              <h3 className="text-lg font-semibold mb-2 text-[var(--popup-header-text)]">
                Customize Your Order
              </h3>
              {/* Rest of your ingredient list content */}
            </div>
          </div>
        </div>

        <div className="sticky">
          <div className="flex flex-col w-full gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center border border-[var(--popup-button-border)] rounded-2xl bg-[var(--popup-button-bg)] shadow-sm h-10 w-full sm:w-auto">
                <button
                  onClick={() => {/* Your quantity decrease logic */}}
                  className="text-lg font-bold text-[var(--popup-button-text)] px-3 h-full flex items-center hover:text-[var(--popup-button-hover-text)]"
                >
                  -
                </button>
                <span className="px-3 text-md font-semibold h-full flex items-center text-[var(--popup-button-text)]">
                  1
                </span>
                <button
                  onClick={() => {/* Your quantity increase logic */}}
                  className="text-lg font-bold text-[var(--popup-button-text)] px-3 h-full flex items-center hover:text-[var(--popup-button-hover-text)]"
                >
                  +
                </button>
              </div>

              <button
                onClick={onAddToBasket}
                className="flex justify-between items-center border border-[var(--popup-button-primary-border)] bg-[var(--popup-button-primary-bg)] text-[var(--popup-button-primary-text)] px-6 h-10 rounded-2xl hover:bg-[var(--popup-button-primary-hover-bg)] font-medium shadow-sm w-full sm:w-auto sm:min-w-[200px]"
              >
                <span className="text-sm flex items-center">
                  Add to Basket
                </span>
                <div className="flex flex-col items-end ml-4 justify-center">
                  <span className="font-bold">
                    €{item.price}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupIngredients; 