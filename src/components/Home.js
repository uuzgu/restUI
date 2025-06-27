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
    <div className={`bg-[var(--home-bg)] pb-responsive ${darkMode ? 'dark' : ''}`}>
      {/* Main Content Container - Responsive width for all sections */}
      <div className="container-responsive">
        {/* Image Slider */}
        <ImageSlider images={images} className="mt-responsive-header-gap" />

        {/* Text and Image Side by Side */}
        <div className="flex flex-col md:flex-row gap-responsive mb-responsive">
          {/* Welcome Message Box */}
          <div className="bg-[var(--home-card-bg)] rounded-2xl card-responsive shadow-lg flex-1 flex flex-col justify-between transition-colors duration-200">
            <div>
              <h1 className="text-responsive-3xl text-[var(--home-heading)] mb-responsive font-bold transition-colors duration-200">
                {translations[language].welcomeMessage || 'Welcome to Pizza Vienna – Where Flavor Meets Freshness'}
              </h1>
              <p className="text-responsive-large text-[var(--home-text-secondary)] mb-responsive transition-colors duration-200">
                {translations[language].welcomeText || 'At Pizza Vienna, we serve more than just food — we serve the best culinary experience in town. Our menu is crafted with passion, featuring a wide selection of delicious, handcrafted dishes made from the freshest, high-quality ingredients.'}
              </p>
            </div>
            <div className="flex flex-col gap-responsive">
              {!showOrderOptions ? (
                <button
                  onClick={handleOrderNowClick}
                  className="btn-responsive bg-[var(--home-button-bg)] hover:bg-[var(--home-button-hover)] text-[var(--home-button-text)] font-semibold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg"
                >
                  {translations[language].orderNow || 'Order Now'}
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-responsive">
                  <button
                    onClick={() => handleOrderMethodSelect('delivery')}
                    className="btn-responsive flex-1 bg-[var(--home-button-bg)] hover:bg-[var(--home-button-hover)] text-[var(--home-button-text)] font-semibold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span className="text-responsive-xl">🚚</span>
                    <span>{translations[language].delivery || 'Delivery'}</span>
                  </button>
                  <button
                    onClick={() => handleOrderMethodSelect('selfCollection')}
                    className="btn-responsive flex-1 bg-[var(--home-button-bg)] hover:bg-[var(--home-button-hover)] text-[var(--home-button-text)] font-semibold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl active:scale-95 shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span className="text-responsive-xl">🏃</span>
                    <span>{translations[language].selfCollection || 'Pickup'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Image Box */}
          <div className="bg-[var(--home-card-bg)] rounded-2xl card-responsive shadow-lg flex-1 flex items-center justify-center transition-colors duration-200">
            <img
              src={homeHours}
              alt="Opening Hours"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="bg-[var(--home-card-bg)] rounded-2xl card-responsive shadow-lg transition-colors duration-200">
          <h2 className="text-responsive-2xl text-[var(--home-heading)] mb-responsive font-bold text-center transition-colors duration-200">
            {translations[language].visitUs || 'Visit Us'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-responsive">
            <div className="flex flex-col items-center text-center gap-responsive-small">
              <div className="bg-[var(--home-icon-bg)] p-responsive rounded-full transition-colors duration-200">
                <Clock className="w-8 h-8 text-[var(--home-icon)]" />
              </div>
              <h3 className="font-semibold text-responsive-large text-[var(--home-text-primary)] transition-colors duration-200">{translations[language].openingHours || 'Opening Hours'}</h3>
              <p className="text-responsive-base text-[var(--home-text-secondary)] transition-colors duration-200">{translations[language].openDaily || 'Open Daily'}</p>
            </div>
            <div className="flex flex-col items-center text-center gap-responsive-small">
              <div className="bg-[var(--home-icon-bg)] p-responsive rounded-full transition-colors duration-200">
                <Phone className="w-8 h-8 text-[var(--home-icon)]" />
              </div>
              <h3 className="font-semibold text-responsive-large text-[var(--home-text-primary)] transition-colors duration-200">{translations[language].contact || 'Contact'}</h3>
              <p className="text-responsive-base text-[var(--home-text-secondary)] transition-colors duration-200">{translations[language].phoneNumber || '+43 123 456 789'}</p>
            </div>
            <div className="flex flex-col items-center text-center gap-responsive-small">
              <div className="bg-[var(--home-icon-bg)] p-responsive rounded-full transition-colors duration-200">
                <MapPin className="w-8 h-8 text-[var(--home-icon)]" />
              </div>
              <h3 className="font-semibold text-responsive-large text-[var(--home-text-primary)] transition-colors duration-200">{translations[language].location || 'Location'}</h3>
              <p className="text-responsive-base text-[var(--home-text-secondary)] transition-colors duration-200">{translations[language].address || 'Vienna, Austria'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 