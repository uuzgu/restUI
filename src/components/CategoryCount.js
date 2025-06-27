import React, { useRef, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import './CategoryCount.css';

// Import images directly
import pizzaImage from '../assets/images/categories/pizzaCategoryListpng.png';
import bowlImage from '../assets/images/categories/bowlCategory.png';
import burgerImage from '../assets/images/categories/cheeseburgerCategoryList.png';
import saladImage from '../assets/images/categories/saladCategoryList.png';
import breakfastImage from '../assets/images/categories/breakfastCategoryList.png';
import drinksImage from '../assets/images/categories/drinksCategoryList.png';
import soupImage from '../assets/images/categories/soupCategoryList.png';
import dessertImage from '../assets/images/categories/dessertCategoryList.png';

const CategoryCount = ({ categories, activeCategory, setActiveCategory, scrollToSection }) => {
  const categoryListRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

  // Map category names to appropriate images
  const getCategoryImage = (categoryName) => {
    if (!categoryName) return pizzaImage;
    
    const name = categoryName.toLowerCase();
    
    if (name.includes('pizza')) return pizzaImage;
    if (name.includes('bowl')) return bowlImage;
    if (name.includes('burger') || name.includes('hamburger')) return burgerImage;
    if (name.includes('salad')) return saladImage;
    if (name.includes('breakfast')) return breakfastImage;
    if (name.includes('drink') || name.includes('beverage')) return drinksImage;
    if (name.includes('soup')) return soupImage;
    if (name.includes('dessert')) return dessertImage;
    if (name.includes('promotion')) return pizzaImage;
    
    // Default to pizza image for unknown categories
    return pizzaImage;
  };

  useEffect(() => {
    if (categoryListRef.current) {
      categoryListRef.current.scrollLeft = 0;
      updateScrollButtons();
    }
  }, [categories]);

  // Add resize listener for better responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (categoryListRef.current) {
        updateScrollButtons();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateScrollButtons = () => {
    if (categoryListRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryListRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  const scrollCategories = (direction) => {
    if (categoryListRef.current) {
      const scrollAmount = categoryListRef.current.clientWidth * 0.6;
      categoryListRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });

      setTimeout(updateScrollButtons, 300);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    scrollToSection(categoryId);
  };

  const handleImageError = (categoryId) => {
    setImageErrors(prev => ({
      ...prev,
      [categoryId]: true
    }));
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="category-header-container relative flex items-center w-full z-20 bg-[var(--category-header-bg)] shadow-[var(--category-header-shadow)]">
        <div className="flex-1 flex items-center justify-center px-responsive">
          <span className="category-text text-[var(--category-header-text)]">Loading categories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="category-header-container relative flex items-center w-full z-20 bg-[var(--category-header-bg)] shadow-[var(--category-header-shadow)]">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          onClick={() => scrollCategories("left")}
          className="scroll-button absolute left-0 z-30 h-full flex items-center justify-center bg-[var(--category-header-bg)] transition-all duration-200 hover:bg-opacity-90"
          style={{ 
            background: `linear-gradient(to right, var(--category-header-bg), transparent)`,
            paddingLeft: 'clamp(0.5rem, 1vw, 1rem)',
            paddingRight: 'clamp(0.5rem, 1vw, 1rem)'
          }}
        >
          <ChevronLeftIcon className="w-responsive-icon h-responsive-icon text-[var(--category-header-active)]" />
        </button>
      )}

      {/* Scrollable Category List */}
      <div
        ref={categoryListRef}
        className="category-list flex-1 flex items-center overflow-x-auto h-full scrollbar-hide"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          gap: 'clamp(0.25rem, 1vw, 0.75rem)',
          paddingLeft: canScrollLeft ? 'clamp(3rem, 8vw, 4rem)' : 'clamp(0.75rem, 2vw, 1.5rem)',
          paddingRight: canScrollRight ? 'clamp(3rem, 8vw, 4rem)' : 'clamp(0.75rem, 2vw, 1.5rem)',
        }}
        onScroll={updateScrollButtons}
      >
        {categories.map((category) => (
          <button
            key={category.categoryId}
            onClick={() => handleCategoryClick(category.categoryId)}
            className={`category-button flex flex-col items-center justify-center transition-all duration-200 ease-in-out relative border-none outline-none bg-transparent shrink-0
              ${
                activeCategory === category.categoryId
                  ? "text-[var(--category-header-active)]"
                  : "text-[var(--category-header-text)] hover:text-[var(--category-header-active)]"
              }`}
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            tabIndex={0}
          >
            <span 
              className="category-text w-full block text-center font-semibold" 
              title={`${category.category} (${category.itemCount})`}
            >
              {category.category} ({category.itemCount})
            </span>
            {!imageErrors[category.categoryId] && (
              <img 
                src={getCategoryImage(category.category)} 
                alt={category.category}
                className="category-icon"
                onError={() => handleImageError(category.categoryId)}
                loading="lazy"
              />
            )}
            {activeCategory === category.categoryId && (
              <span className="category-underline"></span>
            )}
          </button>
        ))}
      </div>

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          onClick={() => scrollCategories("right")}
          className="scroll-button absolute right-0 z-30 h-full flex items-center justify-center bg-[var(--category-header-bg)] transition-all duration-200 hover:bg-opacity-90"
          style={{ 
            background: `linear-gradient(to left, var(--category-header-bg), transparent)`,
            paddingLeft: 'clamp(0.5rem, 1vw, 1rem)',
            paddingRight: 'clamp(0.5rem, 1vw, 1rem)'
          }}
        >
          <ChevronRightIcon className="w-responsive-icon h-responsive-icon text-[var(--category-header-active)]" />
        </button>
      )}
    </div>
  );
};

export default CategoryCount;
