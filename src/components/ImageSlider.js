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
    <div className={`relative overflow-hidden rounded-2xl z-10 mb-responsive h-responsive-slider ${className}`}>
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
        
        {/* Navigation Arrows */}
        <div className="absolute top-1/2 left-0 right-0 flex justify-between z-20 transform -translate-y-1/2 px-responsive">
          <button
            onClick={goToPrev}
            style={{
              minWidth: '1.75rem',
              minHeight: '1.75rem',
              padding: '0.25rem'
            }}
            className="w-responsive-slider-dot h-responsive-slider-dot flex items-center justify-center bg-[var(--home-slider-nav-bg)] text-[var(--home-text-primary)] rounded-full shadow-lg hover:bg-[var(--home-slider-nav-hover)] transition-colors duration-200 active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-responsive-slider-icon h-responsive-slider-icon" />
          </button>

          <button
            onClick={goToNext}
            style={{
              minWidth: '1.75rem',
              minHeight: '1.75rem',
              padding: '0.25rem'
            }}
            className="w-responsive-slider-dot h-responsive-slider-dot flex items-center justify-center bg-[var(--home-slider-nav-bg)] text-[var(--home-text-primary)] rounded-full shadow-lg hover:bg-[var(--home-slider-nav-hover)] transition-colors duration-200 active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight className="w-responsive-slider-icon h-responsive-slider-icon" />
          </button>
        </div>

        {/* Slide indicators */}
        <div className="absolute left-1/2 bottom-4 transform -translate-x-1/2 z-20 flex space-x-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                minWidth: '1.75rem',
                minHeight: '1.75rem',
                padding: '0.25rem'
              }}
              className={`w-responsive-slider-dot h-responsive-slider-dot rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-60 border-2 border-transparent hover:border-white hover:border-opacity-30 flex items-center justify-center
                ${index === currentIndex ? 'bg-[var(--home-slider-dot-active)] scale-110 shadow-lg' : 'bg-[var(--home-slider-dot-inactive)] hover:bg-[var(--home-slider-dot-active)] hover:bg-opacity-70'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageSlider; 