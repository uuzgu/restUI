import { useLocation, Link } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
import pizzaLogo from "../assets/pizzaLogoTr.png";
import pizzaLogoDark from "../assets/pizzalogodark.png"; 
import { Instagram, Twitter, Moon, Sun, ShoppingCart } from 'lucide-react';
import { useDarkMode } from '../DarkModeContext';
import '../colors/headerColors.css';

// Reusable button styles
const buttonBaseClasses = "w-9 h-9 sm:w-10 sm:h-10 p-2 flex items-center justify-center border border-[var(--header-border)] bg-[var(--header-button-bg)] text-[var(--header-text-primary)] rounded-full hover:bg-[var(--header-button-hover)] transition-colors duration-200";

// Base button styles without border (for basket button)
const buttonBaseNoBorderClasses = "w-9 h-9 sm:w-10 sm:h-10 p-2 flex items-center justify-center bg-[var(--header-button-bg)] rounded-full hover:bg-[var(--header-button-hover)] transition-colors duration-200";

// Navigation link component
const NavLink = ({ to, isActive, children }) => (
  <div className="relative inline-block">
    <Link
      to={to}
      className={`text-base sm:text-lg font-semibold font-sans truncate ${
        isActive
          ? "text-[var(--header-text-active)]"
          : "text-[var(--header-text-primary)] hover:text-[var(--header-text-hover)]"
      }`}
    >
      {children}
    </Link>
    <div 
      className={`absolute bottom-0 left-0 h-0.5 bg-[var(--header-border-active)] ${
        isActive ? "w-full" : "w-0"
      }`}
    />
  </div>
);

const Header = ({ toggleBasket, basketVisible }) => {
  const location = useLocation();
  const { language, toggleLanguage, translations } = useLanguage();
  const isOrderPage = location.pathname === "/order";
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`main-header bg-[var(--header-bg)] fixed top-0 left-0 w-full z-[2000] ${darkMode ? 'dark' : ''}`}>
      <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 flex flex-wrap items-center justify-between h-20 sm:h-24 gap-y-2">
        {/* 🔴 LEFT: Logo + Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-6 md:space-x-8">
          <div className="relative h-16 sm:h-24 flex items-center mr-2 sm:mr-6">
            <img
              src={pizzaLogo}
              alt="Pizza Logo"
              className="h-12 sm:h-20 w-auto object-contain block dark:hidden"
            />
            <img
              src={pizzaLogoDark}
              alt="Pizza Logo Dark"
              className="h-12 sm:h-20 w-auto object-contain hidden dark:block"
            />
          </div>

          <div className="flex items-center space-x-2 sm:space-x-6 md:space-x-8">
            <NavLink to="/" isActive={location.pathname === "/"}>
              {translations[language].home || "HOME"}
            </NavLink>
            <NavLink to="/order" isActive={location.pathname === "/order"}>
              {translations[language].order || "ORDER"}
            </NavLink>
          </div>
        </div>

        {/* 🟢 RIGHT: Language, Theme Toggle, and Basket/Socials */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={buttonBaseClasses}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className={buttonBaseClasses}
          >
            <span className="text-xl sm:text-2xl">{language === "en" ? "🇬🇧" : "🇹🇷"}</span>
          </button>

          {/* Basket Toggle - Only visible on order page */}
          {isOrderPage && (
            <button
              onClick={toggleBasket}
              className={`${buttonBaseNoBorderClasses} border ${
                basketVisible 
                  ? 'border-[var(--header-basket-border-active)] text-[var(--header-basket-text-active)]' 
                  : 'border-[var(--header-basket-border)] text-[var(--header-basket-text)]'
              }`}
            >
              <ShoppingCart className="w-5 h-5 inline-block" />
            </button>
          )}

          {/* Social Links - Only on home page and not on mobile */}
          {!isOrderPage && (
            <div className="hidden sm:flex space-x-2">
              <a
                href="https://instagram.com/YOUR_PAGE"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonBaseClasses}
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/YOUR_PAGE"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonBaseClasses}
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
