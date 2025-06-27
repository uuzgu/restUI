import React, { useState, useEffect } from 'react';
import { useDarkMode } from '../DarkModeContext';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const MenuSlider = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { darkMode } = useDarkMode();
  
  // Filter items that have images
  const itemsWithImages = items.filter(item => item.image_url);
  
  useEffect(() => {
    // If no items with images, don't set up the interval
    if (itemsWithImages.length === 0) return;
    
    // Set up interval to change slides every 5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === itemsWithImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [itemsWithImages.length]);
  
  // If no items with images, don't render the slider
  if (itemsWithImages.length === 0) return null;
  
  // Handle manual navigation
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };
  
  // Navigate to previous slide
  const goToPreviousSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? itemsWithImages.length - 1 : prevIndex - 1
    );
  };
  
  // Navigate to next slide
  const goToNextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === itemsWithImages.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  return (
    <div className="menu-slider-container w-full overflow-hidden mb-4">
      <div 
        className="menu-slider flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {itemsWithImages.map((item, index) => (
          <div 
            key={item.id} 
            className="menu-slide min-w-full flex-shrink-0 relative"
          >
            <div className="relative h-responsive-slider w-full">
              <img 
                src={item.image_url} 
                alt={item.name || 'Item'} 
                className="w-full h-full object-cover rounded-lg"
              />
              <div className={`absolute bottom-0 left-0 right-0 p-4 rounded-b-lg ${
                darkMode ? 'bg-gray-800/80' : 'bg-white/80'
              }`}>
                <h3 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {item.name || 'Unnamed Item'}
                </h3>
                <p className={`text-lg font-semibold ${
                  darkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  ${item.price}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation arrows */}
      <button 
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-all duration-200"
        onClick={goToPreviousSlide}
        aria-label="Previous slide"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>
      
      <button 
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-all duration-200"
        onClick={goToNextSlide}
        aria-label="Next slide"
      >
        <ChevronRightIcon className="h-6 w-6" />
      </button>
      
      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
        {itemsWithImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentIndex 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuSlider; 