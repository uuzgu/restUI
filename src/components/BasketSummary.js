import React from 'react';

const BasketSummary = ({ basket, translations, language }) => {
  console.log("BasketSummary - Language:", language);
  console.log("Translations:", translations);

  if (!translations || !translations[language]) {
    return <p className="text-center">Language data missing</p>;
  }

  if (!Array.isArray(basket) || basket.length === 0) {
    return (
      <p className="text-center">
        {translations[language].emptyBasket}
      </p>
    );
  }

  const getItemName = (item) => {
    if (!item) return 'Unknown Item';
    return item.name || 'Unnamed Item';
  };

  const getSelectedIngredients = (item) => {
    if (!item || !item.selectedIngredients) return [];
    return item.selectedIngredients;
  };

  const getSelectedDrinks = (item) => {
    if (!item || !item.selectedDrinks) return [];
    return item.selectedDrinks;
  };

  const getSelectedSides = (item) => {
    if (!item || !item.selectedSides) return [];
    return item.selectedSides;
  };

  const formatOptions = (options) => {
    if (!options || options.length === 0) return '';
    
    const counts = {};
    options.forEach(option => {
      if (option && option.name) {
        counts[option.name] = (counts[option.name] || 0) + (option.quantity || 1);
      }
    });

    return Object.entries(counts)
      .filter(([name]) => name) // Filter out any empty or undefined names
      .map(([name, count]) => count > 1 ? `${name} x${count}` : name)
      .join(', ');
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    return basket.reduce((total, item) => {
      return total + (item.discountedPrice || item.originalPrice || 0) * (item.quantity || 1);
    }, 0);
  };

  // Calculate original total price
  const calculateOriginalTotalPrice = () => {
    return basket.reduce((total, item) => {
      return total + (item.originalPrice || 0) * (item.quantity || 1);
    }, 0);
  };

  const totalPrice = calculateTotalPrice();
  const originalTotalPrice = calculateOriginalTotalPrice();
  const hasDiscount = totalPrice < originalTotalPrice;

  return (
    <div className="basket-summary-container">
      <div className="basket-summary">
        <h2 className="summary-title">
          {language === "en" ? "Order Summary" : translations[language].summary || "Summary"}
        </h2>
        <div className="basket-items">
          {basket.map((item, index) => {
            if (!item) return null;

            const selectedIngredients = getSelectedIngredients(item);
            const selectedDrinks = getSelectedDrinks(item);
            const selectedSides = getSelectedSides(item);
            const itemName = getItemName(item);
            const itemQuantity = item.quantity || 1;
            const itemOriginalPrice = item.originalPrice || 0;
            const itemDiscountedPrice = item.discountedPrice || itemOriginalPrice;
            const itemHasDiscount = itemDiscountedPrice < itemOriginalPrice;

            // Combine all selected options with their quantities
            const allOptions = [
              ...selectedIngredients.map(ingredient => ({
                name: ingredient.name || 'Unknown Ingredient',
                quantity: ingredient.quantity || 1
              })),
              ...selectedDrinks.map(drink => ({
                name: drink.name || 'Unknown Drink',
                quantity: drink.quantity || 1
              })),
              ...selectedSides.map(side => ({
                name: side.name || 'Unknown Side',
                quantity: side.quantity || 1
              }))
            ];

            return (
              <div key={index} className="basket-item">
                <div className="item-details">
                  <h3>{itemName} x{itemQuantity}</h3>
                  {allOptions.length > 0 && (
                    <div className="ingredients">
                      <p>{formatOptions(allOptions)}</p>
                    </div>
                  )}
                  <div className="item-price">
                    {itemHasDiscount ? (
                      <>
                        <span className="original-price">€{(itemOriginalPrice * itemQuantity).toFixed(2)}</span>
                        <span className="discounted-price text-green-600 dark:text-green-400">
                          €{(itemDiscountedPrice * itemQuantity).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span>€{(itemOriginalPrice * itemQuantity).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="summary-total">
          <span>{translations[language].total || "Total"}:</span>
          <div className="text-right">
            {hasDiscount ? (
              <>
                <span className="text-sm text-gray-500 line-through block">
                  €{originalTotalPrice.toFixed(2)}
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  €{totalPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="price">€{totalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketSummary;
