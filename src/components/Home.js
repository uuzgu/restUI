import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import homeImage1 from '../assets/homeImage1.jpg';
import homeImage2 from '../assets/pizzahome2.png';
import homeImage3 from '../assets/pizzahomeOutside.png';
import homeHours from '../assets/homeHours.png';
import { ChevronLeft, ChevronRight, Clock, Phone, MapPin } from 'lucide-react';
import { useDarkMode } from '../DarkModeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import '../colors/homeColors.css';

const HomePage = () => {
  const { language, translations } = useLanguage();
  const images = [homeImage1, homeImage2, homeImage3];
  const [currentIndex, setCurrentIndex] = useState(0);
  const { darkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [showOrderOptions, setShowOrderOptions] = useState(false);

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

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
  }, [currentIndex, goToNext]);

  const handleOrderNowClick = () => {
    setShowOrderOptions(true);
  };

  const handleOrderMethodSelect = (method) => {
    navigate('/order', { state: { orderMethod: method } });
  };

  return (
    <div className={`bg-[var(--home-bg)] pb-16 ${darkMode ? 'dark' : ''}`}>
      {/* Main Content Container - Consistent width for all sections */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Image Slider */}
        <div className="relative pt-32 h-[600px] sm:h-[700px] overflow-hidden rounded-2xl z-10 mb-12">
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
                className="w-12 h-12 flex items-center justify-center bg-[var(--home-card-bg)] text-[var(--home-text-primary)] rounded-full shadow-lg hover:bg-[var(--home-card-bg)] transition-colors duration-200 -ml-1 sm:-ml-2"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={goToNext}
                className="w-12 h-12 flex items-center justify-center bg-[var(--home-card-bg)] text-[var(--home-text-primary)] rounded-full shadow-lg hover:bg-[var(--home-card-bg)] transition-colors duration-200 -mr-1 sm:-mr-2"
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
                    ${index === currentIndex ? 'bg-[var(--home-text-primary)] scale-110 shadow-md' : 'bg-[var(--home-text-secondary)]'}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Text and Image Side by Side */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          {/* Welcome Message Box */}
          <div className="bg-[var(--home-card-bg)] rounded-2xl p-8 shadow-lg flex-1 flex flex-col justify-between transition-colors duration-200">
            <div>
              <h1 className="text-3xl sm:text-4xl text-[var(--home-heading)] mb-6 leading-tight font-bold transition-colors duration-200">
                {translations[language].welcomeMessage || 'Welcome to Pizza Vienna – Where Flavor Meets Freshness'}
              </h1>
              <p className="text-lg text-[var(--home-text-secondary)] mb-6 leading-relaxed transition-colors duration-200">
                {translations[language].welcomeText || 'At Pizza Vienna, we serve more than just food — we serve the best culinary experience in town. Our menu is crafted with passion, featuring a wide selection of delicious, handcrafted dishes made from the freshest, high-quality ingredients.'}
              </p>
            </div>
            <div className="flex flex-col space-y-4">
              {!showOrderOptions ? (
                <button
                  onClick={handleOrderNowClick}
                  className="inline-block bg-[var(--home-button-bg)] hover:bg-[var(--home-button-hover)] text-[var(--home-button-text)] font-semibold py-3 px-6 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg"
                >
                  {translations[language].orderNow || 'Order Now'}
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleOrderMethodSelect('delivery')}
                    className="flex-1 bg-[var(--home-button-bg)] hover:bg-[var(--home-button-hover)] text-[var(--home-button-text)] font-semibold py-3 px-6 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span className="text-xl">🚚</span>
                    <span>{translations[language].delivery || 'Delivery'}</span>
                  </button>
                  <button
                    onClick={() => handleOrderMethodSelect('selfCollection')}
                    className="flex-1 bg-[var(--home-button-bg)] hover:bg-[var(--home-button-hover)] text-[var(--home-button-text)] font-semibold py-3 px-6 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span className="text-xl">🏃</span>
                    <span>{translations[language].selfCollection || 'Pickup'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Image Box */}
          <div className="bg-[var(--home-card-bg)] rounded-2xl p-8 shadow-lg flex-1 flex items-center justify-center transition-colors duration-200">
            <img
              src={homeHours}
              alt="Opening Hours"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="bg-[var(--home-card-bg)] rounded-2xl p-8 shadow-lg transition-colors duration-200">
          <h2 className="text-2xl sm:text-3xl text-[var(--home-heading)] mb-8 font-bold text-center transition-colors duration-200">
            {translations[language].visitUs || 'Visit Us'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-[var(--home-icon-bg)] p-3 rounded-full transition-colors duration-200">
                <Clock className="w-8 h-8 text-[var(--home-icon)]" />
              </div>
              <h3 className="font-semibold text-lg text-[var(--home-text-primary)] transition-colors duration-200">{translations[language].openingHours || 'Opening Hours'}</h3>
              <p className="text-[var(--home-text-secondary)] transition-colors duration-200">{translations[language].openDaily || 'Open Daily'}</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-[var(--home-icon-bg)] p-3 rounded-full transition-colors duration-200">
                <Phone className="w-8 h-8 text-[var(--home-icon)]" />
              </div>
              <h3 className="font-semibold text-lg text-[var(--home-text-primary)] transition-colors duration-200">{translations[language].contact || 'Contact'}</h3>
              <p className="text-[var(--home-text-secondary)] transition-colors duration-200">{translations[language].phoneNumber || '+43 123 456 789'}</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-[var(--home-icon-bg)] p-3 rounded-full transition-colors duration-200">
                <MapPin className="w-8 h-8 text-[var(--home-icon)]" />
              </div>
              <h3 className="font-semibold text-lg text-[var(--home-text-primary)] transition-colors duration-200">{translations[language].location || 'Location'}</h3>
              <p className="text-[var(--home-text-secondary)] transition-colors duration-200">{translations[language].address || 'Vienna, Austria'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 