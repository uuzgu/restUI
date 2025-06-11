import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import homeImage1 from '../assets/homeImage1.jpg';
import homeImage2 from '../assets/pizzahome2.png';
import homeImage3 from '../assets/pizzahomeOutside.png';
import homeHours from '../assets/homeHours.png';
import { Clock, Phone, MapPin } from 'lucide-react';
import { useDarkMode } from '../DarkModeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import '../colors/homeColors.css';
import ImageSlider from './ImageSlider';

const HomePage = () => {
  const { language, translations } = useLanguage();
  const images = [homeImage1, homeImage2, homeImage3];
  const { darkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [showOrderOptions, setShowOrderOptions] = useState(false);

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

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
        <ImageSlider images={images} />

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