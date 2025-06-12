import { useLocation, Link } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
import pizzaLogo from "../assets/pizzaLogoTr.png";
import pizzaLogoDark from "../assets/pizzalogodark.png"; 
import { Instagram, Twitter, Moon, Sun, ShoppingCart } from 'lucide-react';
import { useDarkMode } from '../DarkModeContext';
import '../colors/headerColors.css';
import './Header.css';

// Navigation link component
const NavLink = ({ to, isActive, children }) => (
  <div className="nav-link">
    <Link
      to={to}
      className={isActive ? "active" : ""}
    >
      {children}
    </Link>
    <div 
      className={`nav-link-indicator ${isActive ? "active" : ""}`}
    />
  </div>
);

const Header = ({ toggleBasket, basketVisible }) => {
  const location = useLocation();
  const { language, toggleLanguage, translations } = useLanguage();
  const isOrderPage = location.pathname === "/order";
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`main-header ${darkMode ? 'dark' : ''}`}>
      <div className="header-container">
        {/* 🔴 LEFT: Logo + Navigation */}
        <div className="nav-container">
          <div className="logo-container">
            <img
              src={pizzaLogo}
              alt="Pizza Logo"
              className="logo-image block dark:hidden"
            />
            <img
              src={pizzaLogoDark}
              alt="Pizza Logo Dark"
              className="logo-image hidden dark:block"
            />
          </div>

          <div className="nav-container">
            <NavLink to="/" isActive={location.pathname === "/"}>
              {translations[language].home || "HOME"}
            </NavLink>
            <NavLink to="/order" isActive={location.pathname === "/order"}>
              {translations[language].order || "ORDER"}
            </NavLink>
          </div>
        </div>

        {/* 🟢 RIGHT: Language, Theme Toggle, and Basket/Socials */}
        <div className="right-section">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="button-base"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="button-base"
          >
            <span className="text-xl sm:text-2xl">{language === "en" ? "🇬🇧" : "🇹🇷"}</span>
          </button>

          {/* Basket Toggle - Only visible on order page */}
          {isOrderPage && (
            <button
              onClick={toggleBasket}
              className={`button-base-no-border border ${
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
            <div className="social-links">
              <a
                href="https://instagram.com/YOUR_PAGE"
                target="_blank"
                rel="noopener noreferrer"
                className="button-base"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/YOUR_PAGE"
                target="_blank"
                rel="noopener noreferrer"
                className="button-base"
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
