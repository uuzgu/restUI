import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ImageSlider = ({ images, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      goToNext();
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <div className={`relative pt-32 h-[600px] sm:h-[700px] overflow-hidden rounded-2xl z-10 mb-12 ${className}`}>
      <div className="relative w-full h-full">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Slide ${index + 1}`}
            className={`
              absolute top-0 left-0 w-full h-full object-cover rounded-2xl transition-opacity duration-1000 ease-in-out
              ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}
            `}
          />
        ))}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-[var(--home-overlay-gradient)] rounded-2xl" />
        
        {/* Arrows */}
        <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 sm:px-8 z-20" style={{ transform: 'translateY(-50%)' }}>
          <button
            onClick={goToPrev}
            className="w-12 h-12 flex items-center justify-center bg-[var(--home-slider-nav-bg)] text-[var(--home-text-primary)] rounded-full shadow-lg hover:bg-[var(--home-slider-nav-hover)] transition-colors duration-200 -ml-1 sm:-ml-2"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            className="w-12 h-12 flex items-center justify-center bg-[var(--home-slider-nav-bg)] text-[var(--home-text-primary)] rounded-full shadow-lg hover:bg-[var(--home-slider-nav-hover)] transition-colors duration-200 -mr-1 sm:-mr-2"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400
                w-3 h-3 sm:w-4 sm:h-4 min-w-[24px] min-h-[24px] flex items-center justify-center
                ${index === currentIndex ? 'bg-[var(--home-slider-dot-active)] scale-110 shadow-md' : 'bg-[var(--home-slider-dot-inactive)]'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageSlider; 