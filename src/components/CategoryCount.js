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

  // Debug: Log activeCategory whenever it changes
  React.useEffect(() => {
    console.log('Active category:', activeCategory);
  }, [activeCategory]);

  // Default category image mapping for fallback
  const defaultCategoryImages = {
    "0": pizzaImage, // Using pizza image for promotions
    "1": pizzaImage,
    "2": bowlImage,
    "3": burgerImage,
    "4": saladImage,
    "5": breakfastImage,
    "6": drinksImage,
    "7": soupImage,
    "8": dessertImage
  };

  // Sort categories to match backend ordering
  const sortedCategories = [...categories].sort((a, b) => {
    const orderMap = {
      0: 1,  // Promotions
      1: 2,  // Pizza
      2: 3,  // Bowls
      3: 4,  // Hamburgers
      4: 5,  // Salads
      5: 6,  // Breakfast
      6: 7,  // Drinks
      7: 8,  // Soups
      8: 9,  // Desserts
    };
    const aOrder = orderMap[a.categoryId] || 10;
    const bOrder = orderMap[b.categoryId] || 10;
    return aOrder - bOrder;
  });

  useEffect(() => {
    if (categoryListRef.current) {
      categoryListRef.current.scrollLeft = 0;
      updateScrollButtons();
    }
  }, [categories]);

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

  // Handle click: suppress observer, set active, scroll, then re-enable observer
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
    return null;
  }

  return (
    <div className="relative flex items-center w-full h-20 z-20 bg-[var(--category-header-bg)] shadow-[var(--category-header-shadow)]">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          onClick={() => scrollCategories("left")}
          className="absolute left-0 z-10 h-full px-2 bg-[var(--category-header-bg)] transition-colors duration-200"
        >
          <ChevronLeftIcon className="h-5 w-5 text-[var(--category-header-active)]" />
        </button>
      )}

      {/* Scrollable Category List */}
      <div
        ref={categoryListRef}
        className="category-list flex-1 flex items-center overflow-x-auto gap-3 px-2 sm:px-4 md:px-6 pr-8 sm:pr-12 h-full scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onScroll={updateScrollButtons}
      >
        {sortedCategories.map((category) => (
          <button
            key={category.categoryId}
            onClick={() => handleCategoryClick(category.categoryId)}
            className={`h-full px-4 py-2 text-base font-sans flex flex-col items-center justify-center transition-all duration-200 ease-in-out relative overflow-visible min-w-max border-none outline-none bg-transparent
              ${
                activeCategory === category.categoryId
                  ? "text-[var(--category-header-active)]"
                  : "text-[var(--category-header-text)] hover:text-[var(--category-header-active)]"
              }`}
            style={{ touchAction: 'manipulation', marginBottom: 0 }}
            tabIndex={0}
          >
            <span className="mb-1 text-sm sm:text-base w-full block whitespace-normal font-semibold text-center" title={`${category.category} (${category.itemCount})`}>
              {category.category} ({category.itemCount})
            </span>
            {!imageErrors[category.categoryId] && (
              <img 
                src={defaultCategoryImages[category.categoryId.toString()]} 
                alt={category.category}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain"
                onError={() => handleImageError(category.categoryId)}
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
          className="absolute right-0 z-10 h-full px-2 bg-[var(--category-header-bg)] transition-colors duration-200"
        >
          <ChevronRightIcon className="h-5 w-5 text-[var(--category-header-active)]" />
        </button>
      )}
    </div>
  );
};

export default CategoryCount;
