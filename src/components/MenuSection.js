import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { allergenDescriptions } from '../assets/allergenDescriptions';
import './MenuSection.css';
import '../colors/menuSectionColors.css';

const Tooltip = ({ text, position, allergen }) => {
  const [style, setStyle] = useState(null);
  const tooltipRef = React.useRef();

  const allergenStyles = {
    'G': {
      bgColor: 'var(--allergen-gluten-bg)',
      borderColor: 'var(--allergen-gluten-border)',
      textColor: 'var(--allergen-gluten-text)'
    },
    'S': {
      bgColor: 'var(--allergen-soy-bg)',
      borderColor: 'var(--allergen-soy-border)',
      textColor: 'var(--allergen-soy-text)'
    },
    'L': {
      bgColor: 'var(--allergen-milk-bg)',
      borderColor: 'var(--allergen-milk-border)',
      textColor: 'var(--allergen-milk-text)'
    },
    'E': {
      bgColor: 'var(--allergen-eggs-bg)',
      borderColor: 'var(--allergen-eggs-border)',
      textColor: 'var(--allergen-eggs-text)'
    }
  };

  const styleObj = allergenStyles[allergen] || {
    bgColor: 'var(--menu-item-card-bg)',
    borderColor: 'var(--menu-item-card-border)',
    textColor: 'var(--menu-item-title)'
  };

  useEffect(() => {
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      let left = position.x - tooltipRect.width / 2;
      let top = position.y;
      const padding = 8;

      // Clamp left edge
      if (left < padding) {
        left = padding;
      }
      // Clamp right edge
      if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
      }

      setStyle({
        position: 'fixed',
        left,
        top,
        backgroundColor: styleObj.bgColor,
        color: styleObj.textColor,
        padding: '16px 20px',
        borderRadius: '12px',
        fontSize: '15px',
        lineHeight: '1.6',
        zIndex: 9999,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05)',
        pointerEvents: 'none',
        maxWidth: '350px',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${styleObj.borderColor}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontWeight: '500',
        letterSpacing: '0.3px',
        wordBreak: 'break-word',
      });
    }
  }, [position, styleObj.bgColor, styleObj.borderColor, styleObj.textColor]);

  return createPortal(
    <div
      ref={tooltipRef}
      style={
        style || {
          position: 'fixed',
          left: position.x,
          top: position.y,
          backgroundColor: styleObj.bgColor,
          color: styleObj.textColor,
          border: `1px solid ${styleObj.borderColor}`,
          zIndex: 9999,
          pointerEvents: 'none',
          padding: '16px 20px',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: '500',
          letterSpacing: '0.3px',
          wordBreak: 'break-word',
          maxWidth: '350px',
        }
      }
    >
      {text}
    </div>,
    document.body
  );
};

const MenuSection = ({ title, items, fetchIngredients, categoryId }) => {
  const [tooltip, setTooltip] = useState(null);

  if (!items || items.length === 0) {
    return null;
  }

  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) return '€0.00';
    return `€${price.toFixed(2)}`;
  };

  const categoryName = items[0]?.category_name || title || 'Menu Items';

  // Debug logging for image URLs
  console.log('MenuSection items with image URLs:', items.map(item => ({
    name: item.name,
    image_url: item.image_url,
    hasImage: !!item.image_url
  })));

  return (
    <div id={`category-${categoryId}`} className="mt-6 pt-4 w-full">
      {tooltip && <Tooltip text={tooltip.text} position={tooltip.position} allergen={tooltip.allergen} />}
      
      <div className="relative w-full h-responsive-banner mb-responsive rounded-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop"
          alt={categoryName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h3 className="text-4xl font-bold text-white text-center">
            {categoryName}
          </h3>
        </div>
      </div>

      <div className="grid-container w-full">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
          {items.map((item) => (
            <div
              className={`item-box ${!item.image_url ? "no-image" : "item-with-image"} 
                cursor-pointer relative bg-[var(--menu-item-card-bg)] 
                text-[var(--menu-item-title)] 
                border border-[var(--menu-item-card-border)] 
                rounded-lg p-4 w-full
                transition-colors duration-200
                hover:shadow-[var(--menu-item-card-shadow)] hover:border-[var(--menu-item-card-hover)]
                flex flex-row gap-4`}
              key={item.id}
              onClick={() => fetchIngredients(item)}
            >
              {/* Left side - Item details */}
              <div className="item-details flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex flex-col space-y-2">
                  <h4 className="item-name text-lg font-semibold transition-colors duration-200 text-[var(--menu-item-title)] leading-tight">
                    {item.name}
                  </h4>
                  <p className="item-description text-sm text-[var(--menu-item-desc)] line-clamp-2 transition-colors duration-200 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2 mt-auto pt-3">
                  <div>
                    {item.discountPercentage > 0 ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-[var(--menu-item-discount)] line-through text-sm">
                          {formatPrice(item.originalPrice)}
                        </span>
                        <span className="text-[var(--menu-item-price)] font-semibold text-lg">
                          {formatPrice(item.discountedPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[var(--menu-item-price)] font-semibold text-lg">
                        {formatPrice(item.price)}
                      </span>
                    )}
                  </div>
                  
                  {item.allergens && item.allergens.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', position: 'relative', zIndex: 2, overflow: 'visible' }}>
                      {item.allergens.map((allergen, index) => {
                        const allergenVarMap = {
                          G: 'gluten',
                          S: 'soy',
                          L: 'milk',
                          E: 'eggs'
                        };
                        const cssVar = allergenVarMap[allergen];
                        const description = allergenDescriptions[allergen] || `Allergen: ${allergen}`;

                        return (
                          <div
                            key={index}
                            className="relative"
                            style={{ cursor: 'help' }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                text: description,
                                position: {
                                  x: rect.left + rect.width / 2,
                                  y: rect.bottom + 8
                                },
                                allergen: allergen
                              });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                text: description,
                                position: {
                                  x: rect.left + rect.width / 2,
                                  y: rect.bottom + 8
                                },
                                allergen: allergen
                              });
                            }}
                          >
                            <span
                              className="allergen-indicator"
                              style={{
                                backgroundColor: `var(--allergen-${cssVar}-bg)`,
                                color: `var(--allergen-${cssVar}-text)`,
                                borderColor: `var(--allergen-${cssVar}-border)`
                              }}
                            >
                              {allergen.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Item image */}
              {item.image_url && (
                <div className="item-image relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 flex-shrink-0">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="object-cover w-full h-full rounded-lg"
                    onError={(e) => {
                      console.log('Image failed to load:', item.image_url, 'for item:', item.name);
                      e.target.style.display = 'none';
                      e.target.parentElement.classList.add('no-image');
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', item.image_url, 'for item:', item.name);
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchIngredients(item);
                    }}
                    className="absolute bottom-1 right-1 w-8 h-8 bg-[var(--menu-item-add-light)] 
                      border-2 border-[var(--menu-item-add-border-light)] 
                      text-[var(--menu-item-add-text-light)] text-lg
                      flex items-center justify-center rounded-full
                      transition-all duration-200 hover:scale-110
                      hover:bg-[var(--menu-item-add-hover-light)]
                      dark:bg-[var(--menu-item-add-dark)]
                      dark:border-[var(--menu-item-add-border-dark)]
                      dark:text-[var(--menu-item-add-text-dark)]
                      dark:hover:bg-[var(--menu-item-add-hover-dark)]"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuSection;
