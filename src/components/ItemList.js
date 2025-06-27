import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
import { TrashIcon, CheckIcon } from "@heroicons/react/24/solid";
import CategoryCount from "../components/CategoryCount";
import emptyBasket from "../assets/emptyBasket.png";
import MenuSection from "../components/MenuSection";
import Basket from "../components/Basket";
import { useDarkMode } from "../DarkModeContext";
import "../colors/popupIngredientsColors.css";
import { useApi } from '../contexts/ApiContext';

const ItemList = ({ basketVisible, setBasketVisible, basket, setBasket }) => {
  const { language, translations } = useLanguage();
  const location = useLocation();
  const [itemOptions, setItemOptions] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [ingredientQuantities, setIngredientQuantities] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [popupItemQuantity, setPopupItemQuantity] = useState(1);
  const [itemNote, setItemNote] = useState("");
  const [orderMethod, setOrderMethod] = useState("delivery");
  const [categories, setCategories] = useState([]);
  const [hasMissingRequiredOptions, setHasMissingRequiredOptions] = useState(false);
  const [showRequiredOptionsWarning, setShowRequiredOptionsWarning] = useState(false);
  const [attentionGroupId, setAttentionGroupId] = useState(null);
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const observer = useRef(null);
  const { api } = useApi();

  // Scroll to top when component mounts or location state changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.state]);

  // Initialize order method from navigation state if available
  useEffect(() => {
    if (location.state?.basket) {
      setBasket(location.state.basket);
      setBasketVisible(true);
    }
    if (location.state?.orderMethod) {
      setOrderMethod(location.state.orderMethod);
    }
  }, [location.state, setBasket, setBasketVisible]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        const data = response.data;
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError(error.message);
      }
    };

    fetchCategories();
  }, [api]);

  // Create category labels from fetched categories
  const categoryLabels = useMemo(() => {
    const labels = {};
    categories.forEach(category => {
      const id = category.id ?? category.Id;
      const name = category.name ?? category.Name;
      if (id !== undefined && name) {
        labels[id] = name.toUpperCase();
      }
    });
    return labels;
  }, [categories]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get('/items');
        const data = response.data;

        // Map the data to match the expected structure
        const mappedData = data.map(item => {
          const categoryName = item.Category?.Name || categoryLabels[item.CategoryId] || 'Other';
          const price = typeof item.Price === 'number' ? item.Price : 0;
          
          return {
            id: item.Id,
            name: item.Name || 'Unnamed Item',
            description: item.Description || 'No description available',
            price: price,
            category_id: item.CategoryId,
            category_name: categoryName,
            image_url: item.ImageUrl,
            basePrice: price,
            originalPrice: price,
            discountedPrice: price,
            discountPercentage: 0,
            currency: '€',
            allergens: item.ItemAllergens?.map(allergen => allergen.AllergenCode) || []
          };
        });

        console.log('Mapped items with categories:', mappedData);
        setItems(mappedData);
      } catch (error) {
        console.error("Error fetching items:", error);
        setError(error.message);
      }
    };

    fetchItems();

    window.addEventListener("scroll", detectActiveCategory);

    return () => {
      window.removeEventListener("scroll", detectActiveCategory);
    };
  }, [api, categoryLabels]);

  const categorizedItems = items.reduce((acc, item) => {
    const categoryId = item?.category_id;
    if (categoryId === undefined || categoryId === null) return acc;  // Only filter out undefined/null
    if (!acc[categoryId]) acc[categoryId] = [];
    acc[categoryId].push(item);
    return acc;
  }, {});

  // Filter items based on search query
  const filteredCategorizedItems = useMemo(() => {
    if (!searchQuery.trim()) return categorizedItems;

    const query = searchQuery.toLowerCase().trim();
    const filtered = {};

    Object.entries(categorizedItems).forEach(([categoryId, items]) => {
      const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      );
      if (filteredItems.length > 0) {
        filtered[categoryId] = filteredItems;
      }
    });

    return filtered;
  }, [categorizedItems, searchQuery]);

  // Sort categories to match backend ordering
  const sortedCategoryIds = Object.keys(filteredCategorizedItems).sort((a, b) => {
    // Get categories from API data
    const categoryA = categories.find(cat => cat.id === parseInt(a));
    const categoryB = categories.find(cat => cat.id === parseInt(b));
    
    // Use DisplayOrder from API, fallback to 999 if not set
    const orderA = categoryA?.DisplayOrder ?? 999;
    const orderB = categoryB?.DisplayOrder ?? 999;
    
    return orderA - orderB;
  });

  const scrollToSection = (categoryId) => {
    const targetId = `category-${categoryId}`;
    const section = document.getElementById(targetId);
    
    if (section) {
      // Get all fixed positioned elements at the top of the page
      const fixedElements = Array.from(document.querySelectorAll('[class*="fixed"]'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.top <= 10; // Elements at or near the top
        });
      
      // Calculate total height of fixed headers
      const totalFixedHeight = fixedElements.reduce((total, el) => {
        return total + el.offsetHeight;
      }, 0);
      
      const buffer = 20; // Add buffer for better positioning
      const totalOffset = totalFixedHeight + buffer;
      
      console.log('Scroll calculation:', {
        fixedElementsCount: fixedElements.length,
        totalFixedHeight,
        totalOffset
      });
      
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - totalOffset;

      console.log('Scrolling to position:', offsetPosition);
      
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
      setActiveCategory(categoryId);
    }
  };

  const detectActiveCategory = useCallback(() => {
    const sections = Object.keys(categoryLabels).map((categoryId) => {
      const section = document.getElementById(`category-${categoryId}`);
      console.log(`Checking section category-${categoryId}:`, section ? 'found' : 'not found');
      return section;
    }).filter(Boolean);
    
    console.log('Total sections found for detection:', sections.length);
    
    let closestSection = null;
    let closestOffset = Infinity;

    for (let section of sections) {
      if (section) {
        const rect = section.getBoundingClientRect();
        const offset = Math.abs(rect.top);
        if (offset < closestOffset) {
          closestOffset = offset;
          closestSection = section;
        }
      }
    }

    if (closestSection) {
      const categoryId = closestSection.id.split('-')[1];
      console.log('Setting active category to:', categoryId);
      setActiveCategory(categoryId);
    }
  }, [categoryLabels]);

  useEffect(() => {
    window.addEventListener("scroll", detectActiveCategory);
    return () => {
      window.removeEventListener("scroll", detectActiveCategory);
    };
  }, [detectActiveCategory]);

  // Update the showItemIngredients function to properly process selection groups
  const showItemIngredients = useCallback(async (item) => {
    if (!item?.id) {
      console.error('Invalid item:', item);
      return;
    }
    
    // Close basket when opening popup to prevent collision on mid-size screens
    setBasketVisible(false);
    
    try {
      console.log('Fetching options for item:', item);
      const response = await api.get(`/items/${item.id}/options`);
      const data = response.data;  // Axios automatically parses JSON
      console.log('Raw API response:', data);
      
      // Process and categorize all options with complete information
      const processedData = {
        ingredients: Array.isArray(data?.Ingredients) ? data.Ingredients.map(ing => ({
          id: ing?.Id,
          name: ing?.Name || 'Unknown Ingredient',
          type: 'ingredient',
          price: Number(ing?.ExtraCost || 0),
          isMandatory: ing?.IsMandatory || false,
          canExclude: ing?.CanExclude || false,
        })) : [],
        
        drinkOptions: Array.isArray(data.DrinkOptions) ? data.DrinkOptions.map(drink => ({
          id: drink.Id,
          name: drink.Name,
          type: 'drink',
          price: Number(drink.Price || 0),
          selected: false
        })) : [],
        
        sideOptions: Array.isArray(data.SideOptions) ? data.SideOptions.map(side => ({
          id: side.Id,
          name: side.Name,
          type: 'side',
          price: Number(side.Price || 0),
          selected: false
        })) : [],
        
        itemOffers: Array.isArray(data.ItemOffers) ? data.ItemOffers.map(offer => ({
          id: offer.Id,
          name: offer.Offer?.Name || 'Unknown Offer',
          description: offer.Offer?.Description || '',
          type: 'offer',
          discountPercentage: offer.Offer?.DiscountPercentage || 0,
          selected: false
        })) : [],

        // Combine both item-specific and category-level selection groups, removing duplicates based on Id
        selectionGroups: [
          ...(Array.isArray(data.SelectionGroups) ? data.SelectionGroups : []),
          ...(Array.isArray(data.CategorySelectionGroups) ? data.CategorySelectionGroups : [])
        ]
          .reduce((acc, group) => {
            const existingGroup = acc.find(g => g.Id === group.Id);
            if (!existingGroup) {
              acc.push(group);
            }
            return acc;
          }, [])
          .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
          .map(group => {
            console.log('Processing group:', {
              name: group.Name,
              threshold: group.Threshold,
              type: group.Type
            });
            return {
              id: group.Id,
              name: group.Name,
              type: group.Type,
              isRequired: group.IsRequired,
              minSelect: group.MinSelect,
              maxSelect: group.MaxSelect,
              threshold: group.Threshold,
              displayOrder: group.DisplayOrder,
              options: Array.isArray(group.Options) ? group.Options.map(option => ({
                id: option.Id,
                name: option.Name,
                price: Number(option.Price || 0),
                displayOrder: option.DisplayOrder,
                selected: false,
                quantity: 0,
                type: 'selection'
              })) : []
            };
          })
      };
      
      console.log('Processed selection groups before deduplication:', processedData.selectionGroups);
      
      // Only select mandatory ingredients
      const mandatoryIngredients = processedData.ingredients
        .filter(ing => ing.isMandatory)
        .map(ing => ({ 
          ...ing, 
          selected: true,
          quantity: 1
        }));
      
      // Reset all states
      setSelectedIngredients(mandatoryIngredients);
      setIngredientQuantities({});
      setPopupItemQuantity(1);
      setItemOptions(processedData);
      setSelectedItem(item);
      setShowPopup(true);
      document.body.classList.add('popup-active');
    } catch (error) {
      console.error('Error fetching item options:', error);
    }
  }, [api]);

  // Add state for price calculation
  const [calculatedPrice, setCalculatedPrice] = useState({
    originalPrice: 0,
    discountedPrice: 0,
    discountPercentage: 0,
    singleItemPrice: 0
  });

  // Calculate price when dependencies change
  useEffect(() => {
    const calculatePrice = () => {
      if (!selectedItem || !itemOptions) return;

      const basePrice = Number(selectedItem?.price || 0);
      
      // Process selected items to handle free options within threshold
      const processedItems = itemOptions.selectionGroups.reduce((acc, group) => {
        if (!group.options || !Array.isArray(group.options)) return acc;

        // Get all selected options in this group with their quantities
        const selectedOptions = group.options
          .filter(opt => selectedIngredients.some(ing => ing.id === opt.id && ing.type === 'selection'))
          .map(opt => {
            const quantity = ingredientQuantities[opt.id] || 1;
            return { ...opt, quantity };
          });

        // Sort selected options by their order in the group
        selectedOptions.sort((a, b) => {
          const aIndex = group.options.findIndex(opt => opt.id === a.id);
          const bIndex = group.options.findIndex(opt => opt.id === b.id);
          return aIndex - bIndex;
        });

        // Calculate total quantity of selected options
        const totalSelectedQuantity = selectedOptions.reduce((sum, opt) => sum + opt.quantity, 0);

        // Process options based on threshold
        let remainingFreeQuantity = group.threshold || 0;
        const processedOptions = selectedOptions.map(opt => {
          // Calculate how many of this option are free
          const freeQuantity = Math.min(remainingFreeQuantity, opt.quantity);
          remainingFreeQuantity -= freeQuantity;
          
          // Calculate how many of this option are paid
          const paidQuantity = opt.quantity - freeQuantity;
          
          return {
            ...opt,
            price: Number(opt.price || 0),
            quantity: opt.quantity,
            freeQuantity,
            paidQuantity
          };
        });

        return [...acc, ...processedOptions];
      }, []);

      // Calculate total price including only paid quantities
      const selectedItemsTotal = processedItems.reduce((sum, item) => {
        return sum + (Number(item.price || 0) * (item.paidQuantity || 0));
      }, 0);

      setCalculatedPrice({
        originalPrice: basePrice + selectedItemsTotal,
        discountedPrice: basePrice + selectedItemsTotal,
        discountPercentage: 0,
        singleItemPrice: basePrice + selectedItemsTotal
      });
    };

    calculatePrice();
  }, [selectedItem, selectedIngredients, itemOptions, ingredientQuantities]);

  // Add a state for the displayed price
  const [displayPrice, setDisplayPrice] = useState({
    originalPrice: 0,
    discountedPrice: 0,
    discountPercentage: 0
  });

  // Update display price whenever calculated price changes
  useEffect(() => {
    setDisplayPrice(calculatedPrice);
  }, [calculatedPrice]);

  // Add a function to check for missing required options
  const checkRequiredOptions = useCallback(() => {
    if (!itemOptions?.selectionGroups) return false;
    
    const missingRequired = itemOptions.selectionGroups
      .filter(group => group.isRequired)
      .some(group => !group.options.some(option => 
        selectedIngredients.some(ing => ing.id === option.id && ing.type === 'selection')
      ));
    
    setHasMissingRequiredOptions(missingRequired);
    return missingRequired;
  }, [itemOptions, selectedIngredients]);

  // Update the toggleIngredient function to trigger price recalculation
  const toggleIngredient = useCallback((ingredient) => {
    setSelectedIngredients(prev => {
      // Find existing ingredient by both ID and type
      const existingIngredient = prev.find(ing => 
        ing.id === ingredient.id && ing.type === ingredient.type
      );
      
      let newIngredients;
      if (existingIngredient) {
        if (!ingredient.isMandatory) {
          newIngredients = prev.filter(ing => 
            !(ing.id === ingredient.id && ing.type === ingredient.type)
          );
          // Remove from ingredientQuantities when deselected
          setIngredientQuantities(prev => {
            const newQuantities = { ...prev };
            delete newQuantities[ingredient.id];
            return newQuantities;
          });
        } else {
          newIngredients = prev;
        }
      } else {
        // For SINGLE type selection groups, remove any previously selected options from the same group
        if (ingredient.type === 'selection') {
          const group = itemOptions.selectionGroups.find(g => 
            g.options.some(opt => opt.id === ingredient.id)
          );
          if (group && group.type === 'SINGLE') {
            const filteredPrev = prev.filter(ing => 
              !group.options.some(opt => opt.id === ing.id)
            );
            newIngredients = [...filteredPrev, { 
              ...ingredient, 
              selected: true, 
              quantity: 1,
              price: Number(ingredient.price || 0),
              type: 'selection'
            }];
            // Initialize quantity in ingredientQuantities
            setIngredientQuantities(prev => ({
              ...prev,
              [ingredient.id]: 1
            }));
          } else {
            newIngredients = [...prev, { 
              ...ingredient, 
              selected: true, 
              quantity: 1,
              price: Number(ingredient.price || 0),
              type: ingredient.type || 'selection'
            }];
            // Initialize quantity in ingredientQuantities
            setIngredientQuantities(prev => ({
              ...prev,
              [ingredient.id]: 1
            }));
          }
        } else {
          newIngredients = [...prev, { 
            ...ingredient, 
            selected: true, 
            quantity: 1,
            price: Number(ingredient.price || 0),
            type: ingredient.type || 'selection'
          }];
          // Initialize quantity in ingredientQuantities
          setIngredientQuantities(prev => ({
            ...prev,
            [ingredient.id]: 1
          }));
        }
      }

      // Check required options after updating ingredients
      setTimeout(() => checkRequiredOptions(), 0);

      return newIngredients;
    });
  }, [itemOptions, checkRequiredOptions]);

  // Update the updateItemQuantity function to trigger price recalculation
  const updateItemQuantity = useCallback((itemId, itemType, delta) => {
    setSelectedIngredients(prev => {
      const newIngredients = prev.map(ing => {
        if (ing.id === itemId && ing.type === itemType) {
          const newQuantity = Math.max(0, (ing.quantity || 1) + delta);
          if (newQuantity === 0) {
            return { ...ing, selected: false };
          }
          return { ...ing, quantity: newQuantity };
        }
        return ing;
      }).filter(ing => ing.selected);

      // Update ingredientQuantities state
      setIngredientQuantities(prev => {
        const newQuantities = { ...prev };
        const changedItem = newIngredients.find(ing => ing.id === itemId && ing.type === itemType);
        if (changedItem) {
          newQuantities[itemId] = changedItem.quantity;
        }
        return newQuantities;
      });

      return newIngredients;
    });
  }, []);

  // Add effect to hide warning when selections change
  useEffect(() => {
    if (showRequiredOptionsWarning) {
      setShowRequiredOptionsWarning(false);
    }
  }, [selectedIngredients]);

  // Add effect to clear attention group after 2 seconds
  useEffect(() => {
    if (attentionGroupId) {
      const timer = setTimeout(() => {
        setAttentionGroupId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [attentionGroupId]);

  // Update handleAddToBasket
  const handleAddToBasket = useCallback(() => {
    if (!selectedItem || !itemOptions) return;

    // Check if all required options are selected and find the first missing group
    const missingRequiredGroup = itemOptions.selectionGroups
      .filter(group => group.isRequired)
      .find(group => !group.options.some(option => 
        selectedIngredients.some(ing => ing.id === option.id && ing.type === 'selection')
      ));

    if (missingRequiredGroup) {
      setShowRequiredOptionsWarning(true);
      setAttentionGroupId(missingRequiredGroup.id);
      const groupElement = document.getElementById(`group-${missingRequiredGroup.id}`);
      if (groupElement) {
        groupElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Get all selected items from selectionGroups only
    const selectedItems = itemOptions.selectionGroups.reduce((acc, group) => {
      if (!group.options || !Array.isArray(group.options)) return acc;

      // Get all selected options in this group with their quantities
      const selectedOptions = group.options
        .filter(opt => selectedIngredients.some(ing => ing.id === opt.id && ing.type === 'selection'))
        .map(opt => {
          const quantity = ingredientQuantities[opt.id] || 1;
          return { ...opt, quantity };
        });

      // Sort selected options by their order in the group
      selectedOptions.sort((a, b) => {
        const aIndex = group.options.findIndex(opt => opt.id === a.id);
        const bIndex = group.options.findIndex(opt => opt.id === b.id);
        return aIndex - bIndex;
      });

      // Calculate total quantity of selected options
      const totalSelectedQuantity = selectedOptions.reduce((sum, opt) => sum + opt.quantity, 0);

      // Process options based on threshold
      let remainingFreeQuantity = group.threshold || 0;
      const processedOptions = selectedOptions.map(opt => {
        // Calculate how many of this option are free
        const freeQuantity = Math.min(remainingFreeQuantity, opt.quantity);
        remainingFreeQuantity -= freeQuantity;
        
        // Calculate how many of this option are paid
        const paidQuantity = opt.quantity - freeQuantity;
        
        return {
          ...opt,
          groupName: group.name,
          price: Number(opt.price || 0),
          quantity: opt.quantity,
          freeQuantity,
          paidQuantity
        };
      });

      return [...acc, ...processedOptions];
    }, []);

    const quantity = Number(popupItemQuantity || 1);
    
    // Calculate the base price for a single item (including only paid quantities)
    const basePrice = selectedItem.price + selectedItems.reduce((sum, item) => {
      return sum + (Number(item.price || 0) * (item.paidQuantity || 0));
    }, 0);

    // Total price is base price multiplied by quantity
    const totalPrice = basePrice * quantity;

    const basketItem = {
      id: selectedItem.id,
      name: selectedItem.name,
      basePrice: basePrice,
      originalPrice: totalPrice,
      quantity: quantity,
      note: itemNote.trim(),
      selectedItems: selectedItems.map(item => ({ 
        ...item, 
        quantity: item.quantity || 1,
        price: item.price,
        freeQuantity: item.freeQuantity || 0,
        paidQuantity: item.paidQuantity || 0
      })),
      image: selectedItem.image_url,
      selectionKey: JSON.stringify(selectedItems.map(item => ({
        id: item.id,
        type: item.type,
        quantity: item.quantity || 1
      }))),
      groupOrder: itemOptions.selectionGroups.map(g => g.name)
    };

    // Check if the item already exists in the basket with the same selections and note
    const existingItemIndex = basket.findIndex(
      item => 
        item.id === basketItem.id && 
        item.selectionKey === basketItem.selectionKey &&
        item.note === basketItem.note
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item exists with the same selections and note
      setBasket(prevBasket => {
        const newBasket = [...prevBasket];
        const existingItem = newBasket[existingItemIndex];
        const newQuantity = existingItem.quantity + basketItem.quantity;
        
        // Calculate new total price based on the base price and new quantity
        const updatedPrice = basePrice * newQuantity;
        
        newBasket[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          originalPrice: updatedPrice,
          basePrice: basePrice
        };
        return newBasket;
      });
    } else {
      // Add new item if it doesn't exist or has different selections/note
      setBasket(prevBasket => [...prevBasket, basketItem]);
    }

    setSelectedIngredients([]);
    setIngredientQuantities({});
    setItemNote("");
    setShowPopup(false);
    setShowRequiredOptionsWarning(false);
    document.body.classList.remove('popup-active');
    setBasketVisible(true);
  }, [selectedItem, itemOptions, popupItemQuantity, setBasketVisible, basket, selectedIngredients, itemNote, ingredientQuantities]);

  // Create a memoized component for ingredient items to reduce re-renders
  const IngredientItem = useCallback(({ ingredient, isSelected, onToggle, onQuantityChange, quantity }) => {
    if (!ingredient) return null;

    // Get the price based on the ingredient type
    const getPrice = () => {
      if (typeof ingredient.extraCost === 'number') return ingredient.extraCost;
      if (typeof ingredient.price === 'number') return ingredient.price;
      return 0;
    };

    const price = getPrice();
    const showPrice = price > 0;
    const currentQuantity = ingredientQuantities[ingredient.id] || 1;

    return (
      <div className="ingredient-item flex flex-col mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggle}
              disabled={ingredient.isMandatory}
              className="w-4 h-4 accent-red-500"
            />
            <span>{ingredient.name || 'Unnamed Item'}</span>
          </div>
          
          {isSelected && !ingredient.isMandatory && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateItemQuantity(ingredient.id, ingredient.type, -1)}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-400 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                –
              </button>
              <span className="min-w-[24px] text-center">
                {currentQuantity}
              </span>
              <button
                onClick={() => updateItemQuantity(ingredient.id, ingredient.type, 1)}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-400 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                +
              </button>
            </div>
          )}
        </div>
        
        {showPrice && (
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-6 mt-1">
            +€{price.toFixed(2)}
          </span>
        )}
      </div>
    );
  }, [updateItemQuantity, ingredientQuantities]);

  const toggleQuantityVisibility = (index) => {
    setBasket((prevBasket) =>
      prevBasket.map((item, i) =>
        i === index
          ? { ...item, isAdjustingQuantity: !item.isAdjustingQuantity }
          : item
      )
    );
  };

  const increaseQuantity = useCallback((index) => {
    setBasket(prevBasket => {
      const newBasket = [...prevBasket];
      const item = newBasket[index];
      
      if (!item) return prevBasket;

      const newQuantity = (item.quantity || 1) + 1;
      
      // Calculate total price based on the original base price and new quantity
      const totalPrice = item.basePrice * newQuantity;

      newBasket[index] = {
        ...item,
        quantity: newQuantity,
        originalPrice: totalPrice
      };
      return newBasket;
    });
  }, []);

  const decreaseQuantity = useCallback((index) => {
    setBasket(prevBasket => {
      const newBasket = [...prevBasket];
      const item = newBasket[index];
      
      if (!item) return prevBasket;

      const newQuantity = Math.max(1, (item.quantity || 1) - 1);
      
      // Calculate total price based on the original base price and new quantity
      const totalPrice = item.basePrice * newQuantity;

      newBasket[index] = {
        ...item,
        quantity: newQuantity,
        originalPrice: totalPrice
      };
      return newBasket;
    });
  }, []);

  const removeFromBasket = (index) => {
    setBasket(prevBasket => {
      const newBasket = prevBasket.filter((_, i) => i !== index);
      // Remove discounts from remaining items
      return newBasket.map(item => ({
        ...item,
        discountedPrice: undefined,
        discountPercentage: undefined
      }));
    });
  };

  const confirmQuantity = (index) => {
    setBasket((prevBasket) =>
      prevBasket.map((item, i) =>
        i === index ? { ...item, isAdjustingQuantity: false } : item
      )
    );
  };

  const scrollCategories = (direction) => {
    const scrollAmount = 200;
    const container = document.querySelector(".category-list");

    if (container) {
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (showPopup) {
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [showPopup]);

  useEffect(() => {
    if (!showPopup) {
      document.body.classList.remove('popup-active');
    }
  }, [showPopup]);

  const categoryLabelsWithCount = sortedCategoryIds.map((categoryId) => ({
    category: categoryLabels[parseInt(categoryId)] || `Category ${categoryId}`,
    categoryId: parseInt(categoryId),
    itemCount: filteredCategorizedItems[categoryId].length
  }));

  // Create fallback category list when items haven't loaded yet
  const fallbackCategoryList = categories.map(category => ({
    category: (category.name ?? category.Name).toUpperCase(),
    categoryId: category.id ?? category.Id,
    itemCount: 0
  })).sort((a, b) => {
    const categoryA = categories.find(cat => (cat.id ?? cat.Id) === a.categoryId);
    const categoryB = categories.find(cat => (cat.id ?? cat.Id) === b.categoryId);
    const orderA = categoryA?.DisplayOrder ?? 999;
    const orderB = categoryB?.DisplayOrder ?? 999;
    return orderA - orderB;
  });

  // Use fallback if no items loaded yet, otherwise use the regular list
  const displayCategories = categoryLabelsWithCount.length > 0 ? categoryLabelsWithCount : fallbackCategoryList;

  // Pass orderMethod to Basket component
  const handleOrderMethodChange = (method) => {
    setOrderMethod(method);
  };

  // Add memoized filtered selection groups
  const filteredSelectionGroups = useMemo(() => {
    if (!itemOptions?.selectionGroups) return [];
    
    return itemOptions.selectionGroups
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter((group, index, self) => {
        // Remove duplicates based on name, keeping the one with the highest display order
        const duplicates = self.filter(g => g.name === group.name);
        if (duplicates.length > 1) {
          const highestOrder = Math.max(...duplicates.map(g => g.displayOrder));
          return group.displayOrder === highestOrder;
        }
        return true;
      });
  }, [itemOptions?.selectionGroups]);

  const handleProceedToCheckout = () => {
    navigate('/checkout', { 
      state: { 
        basket, 
        orderMethod,
        basketModified: true // Add this flag to indicate basket was modified in order page
      } 
    });
  };

  // Add effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        // On mobile, ensure basket is properly positioned
        const basketPanel = document.querySelector('.basket-panel');
        if (basketPanel) {
          // Use CSS variable instead of hardcoded value for consistent responsive behavior
          basketPanel.style.top = 'var(--header-height)';
          basketPanel.style.right = '0';
          basketPanel.style.width = '100%';
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial call
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [basketVisible]);

  // Update the popupItemQuantity state to trigger price recalculation
  const updatePopupItemQuantity = useCallback((delta) => {
    setPopupItemQuantity(prev => {
      const newQuantity = Math.max(1, prev + delta);
      return newQuantity;
    });
  }, []);

  return (
    <div className="min-h-screen-dynamic bg-[var(--order-bg)] text-[var(--order-text-primary)] flex flex-col">
      {/* Secondary Header - Fixed position */}
      <div 
        className="bg-[var(--category-header-bg)] fixed left-0 w-full z-40 shadow-[var(--category-header-shadow)] border-b border-[var(--category-header-border)]"
        style={{
          top: 'var(--header-height)'
        }}
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-1 md:py-2 lg:py-3 short:py-0.5 mobile-short:py-0.5 mobile-very-short:py-0.5 mobile-extremely-short:py-0.5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 sm:gap-2 lg:gap-4 short:gap-0.5 mobile-short:gap-0.5 mobile-very-short:gap-0.5 mobile-extremely-short:gap-0.5">
            {/* Categories */}
            <div className="flex items-center w-full lg:flex-1 lg:max-w-none space-x-1 sm:space-x-2 lg:space-x-2 overflow-x-auto scrollbar-hide">
              <CategoryCount
                categories={displayCategories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                scrollToSection={scrollToSection}
              />
            </div>
            {/* Search */}
            <div className="flex items-center w-full lg:w-auto lg:flex-shrink-0 space-x-1 sm:space-x-2 lg:space-x-4">
              <div className="relative w-full lg:w-auto lg:min-w-[250px] xl:min-w-[300px] 2xl:min-w-[350px] lg:max-w-[400px] flex items-center">
                <input
                  type="text"
                  placeholder={` 🔍 ${translations[language].searchMenu}`}
                  className="search-input border-[var(--search-border)] px-2 sm:px-3 lg:px-4 py-2 md:py-2.5 lg:py-3 short:py-1.5 mobile-short:py-1.5 mobile-very-short:py-1.5 mobile-extremely-short:py-1 text-xs sm:text-sm short:text-xs mobile-short:text-xs mobile-very-short:text-xs mobile-extremely-short:text-xs rounded-full shadow-sm focus:ring focus:ring-red-100 focus:outline-none w-full placeholder-[var(--search-placeholder)] bg-[var(--search-bg)] text-[var(--search-text)]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="w-full mx-auto flex-1"
        style={{
          paddingTop: 'calc(var(--header-height) + clamp(3rem, 6vh, 4rem))',
          minHeight: "calc(100 * var(--vh))",
        }}
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 pb-2 sm:pb-4 lg:pb-6 xl:pb-8">
          <div className="mt-2 space-y-4">
            {error ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] short:min-h-[30vh] space-y-2 sm:space-y-4">
                <div className="text-red-500 text-2xl sm:text-4xl mb-1 sm:mb-2">⚠️</div>
                <div className="text-red-500 text-center text-sm sm:text-lg">{error}</div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  {translations[language].retry || 'Retry'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start space-y-3 sm:space-y-4 lg:space-y-6 xl:space-y-8 short:space-y-2">
                {sortedCategoryIds.map((categoryId) => (
                  <MenuSection
                    key={categoryId}
                    categoryId={categoryId}
                    title={categoryLabels[parseInt(categoryId)] || `Category ${categoryId}`}
                    items={filteredCategorizedItems[categoryId]}
                    fetchIngredients={showItemIngredients}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Basket - Positioned outside main content flow */}
      {basketVisible && (
        <Basket
          basket={basket}
          toggleQuantityVisibility={toggleQuantityVisibility}
          increaseQuantity={increaseQuantity}
          decreaseQuantity={decreaseQuantity}
          removeFromBasket={removeFromBasket}
          confirmQuantity={confirmQuantity}
          translations={translations}
          language={language}
          basketVisible={basketVisible}
          orderMethod={orderMethod}
          onOrderMethodChange={handleOrderMethodChange}
          toggleBasket={setBasketVisible.bind(null, false)}
          setBasket={setBasket}
        />
      )}

      {/* Popup - Full viewport overlay */}
      {showPopup && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-2 sm:p-4 overflow-hidden">
          <div className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[500px] lg:max-w-[600px] h-full max-h-[98vh] short:max-h-[95vh] mobile-short:max-h-[90vh] mobile-very-short:max-h-[85vh] mobile-extremely-short:max-h-[80vh] flex flex-col mx-auto bg-[var(--popup-container-bg)] rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-lg popup-container overflow-hidden">
            <div className="rounded-xl sm:rounded-2xl lg:rounded-3xl text-[var(--popup-header-text)] w-full flex flex-col relative h-full overflow-hidden">
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto">
                {/* Header with image and close button */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowPopup(false);
                      setShowRequiredOptionsWarning(false);
                      document.body.classList.remove('popup-active');
                    }}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 popup-close-button-circular bg-[var(--popup-close-button-bg)] text-[var(--popup-close-button-text)] hover:text-[var(--popup-close-button-hover-text)] border border-[var(--popup-close-button-border)] shadow-md z-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {selectedItem.image_url && (
                    <div className="relative w-full h-[clamp(120px,20vh,200px)] short:h-[clamp(80px,15vh,120px)] mobile-short:h-[15vh] mobile-very-short:h-[15vh] mobile-extremely-short:h-[15vh] flex-shrink-0 rounded-t-xl sm:rounded-t-2xl lg:rounded-t-3xl overflow-hidden">
                      <img
                        src={selectedItem.image_url}
                        alt={selectedItem.name || 'Item'}
                        className="w-full h-full object-cover"
                      />
                      {showRequiredOptionsWarning && (
                        <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white py-1 sm:py-2 px-2 sm:px-4 text-center animate-fade-in text-xs sm:text-sm">
                          Please select required options
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 bg-[var(--popup-content-bg)] text-[var(--popup-content-text)]">
                  <div className="mb-2 sm:mb-4">
                    <h2 className="text-lg sm:text-xl lg:text-2xl short:text-base font-bold text-[var(--popup-header-text)] mb-1 sm:mb-2 text-left">
                      {selectedItem.name || 'Unnamed Item'}
                    </h2>
                    <div className="flex items-center mb-1">
                      <span className="text-base sm:text-lg short:text-sm font-bold text-red-500" style={{ textAlign: 'left' }}>
                        €{selectedItem.price}
                      </span>
                    </div>
                    <p className="text-[var(--popup-content-text)] mb-2 sm:mb-4 text-left text-xs sm:text-sm lg:text-base short:text-xs">
                      {selectedItem.description || 'No description available'}
                    </p>

                    <hr className="border-[var(--popup-content-border)] mb-2 sm:mb-4" />

                    <div className="ingredient-list">
                      <h3 className="text-sm sm:text-base lg:text-lg short:text-sm font-semibold mb-1 sm:mb-2 text-[var(--popup-header-text)]">
                        {translations[language].customizeOrder}
                      </h3>

                      {/* Unified Selection Groups Section */}
                      {filteredSelectionGroups.map((group) => {
                        console.log('Rendering group:', {
                          name: group.name,
                          threshold: group.threshold,
                          type: group.type,
                          options: group.options.map(o => o.name)
                        });

                        // Count selected options in this group
                        const selectedCount = selectedIngredients.filter(ing => 
                          ing.type === 'selection' && 
                          group.options.some(opt => opt.id === ing.id)
                        ).length;

                        return (
                          <div 
                            key={group.id}
                            id={`group-${group.id}`}
                            className="mb-2 sm:mb-4 lg:mb-6"
                          >
                            <h4 className="text-xs sm:text-sm lg:text-md short:text-xs font-semibold mb-1 sm:mb-2 lg:mb-3 text-[var(--popup-header-text)] flex items-center">
                              {group.name}
                              {attentionGroupId === group.id && (
                                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              )}
                              <span className="text-xs short:text-[10px] font-normal ml-2 text-[var(--popup-content-text)]">
                                ({group.type === 'EXCLUSIONS' ? 'Optional Exclusions' : group.isRequired ? 'Required' : 'Optional'})
                                {group.type === 'MULTIPLE' && group.threshold > 0 && (
                                  <span className="text-[var(--popup-content-text)] ml-2">{selectedCount}/{group.threshold} free</span>
                                )}
                              </span>
                            </h4>

                            <div className="space-y-1 sm:space-y-2">
                              {group.options.map((option) => {
                                const isSelected = selectedIngredients.some(ing => 
                                  ing.id === option.id && ing.type === 'selection'
                                );

                                // Get sorted selected options in this group for free calculation
                                const selectedOptionsInGroup = selectedIngredients
                                  .filter(ing => ing.type === 'selection' && group.options.some(opt => opt.id === ing.id))
                                  .sort((a, b) => a.id - b.id); // Sort by ID for consistency

                                // Calculate how many of this option are free
                                let remainingFreeQuantity = group.threshold || 0;
                                let freeQuantity = 0;
                                let paidQuantity = 0;

                                if (isSelected) {
                                  const optionQuantity = ingredientQuantities[option.id] || 1;
                                  const optionIndex = selectedOptionsInGroup.findIndex(ing => ing.id === option.id);
                                  
                                  // Calculate free quantity based on position and remaining free quantity
                                  if (optionIndex !== -1) {
                                    const previousOptionsQuantity = selectedOptionsInGroup
                                      .slice(0, optionIndex)
                                      .reduce((sum, opt) => sum + opt.quantity, 0);
                                    
                                    const remainingAfterPrevious = Math.max(0, group.threshold - previousOptionsQuantity);
                                    freeQuantity = Math.min(remainingAfterPrevious, optionQuantity);
                                    paidQuantity = optionQuantity - freeQuantity;
                                  }
                                }

                                const isPartiallyFree = freeQuantity > 0 && paidQuantity > 0;
                                const isFullyFree = freeQuantity === (ingredientQuantities[option.id] || 1);
                                const isFullyPaid = paidQuantity === (ingredientQuantities[option.id] || 1);

                                // Calculate total selected quantity in this group
                                const totalSelectedInGroup = selectedOptionsInGroup.reduce((sum, opt) => sum + opt.quantity, 0);
                                const isWithinThreshold = totalSelectedInGroup <= group.threshold;

                                return (
                                  <div 
                                    key={`${option.id}-${option.name}`} 
                                    className={`flex items-center justify-between p-2 sm:p-3 short:p-1.5 rounded-lg border border-[var(--popup-item-border)] transition-all duration-200 cursor-pointer
                                        ${isSelected
                                        ? 'bg-red-100 dark:bg-[var(--popup-item-selected-bg)] text-[var(--popup-item-selected-text)] border-red-300 dark:border-[var(--popup-item-selected-bg)]'
                                        : 'bg-[var(--popup-item-bg)] text-[var(--popup-item-text)] hover:bg-[var(--popup-item-hover-bg)]'}
                                    `}
                                    style={{ minHeight: 'clamp(40px, 6vw, 48px)', marginBottom: '4px' }}
                                    onClick={() => toggleIngredient({
                                      ...option,
                                      type: 'selection',
                                      groupId: group.id
                                    })}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {group.type === 'MULTIPLE' ? (
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            toggleIngredient({
                                              ...option,
                                              type: 'selection',
                                              groupId: group.id
                                            });
                                          }}
                                          className="w-3 h-3 sm:w-4 sm:h-4 accent-red-500 flex-shrink-0"
                                        />
                                      ) : (
                                        <input
                                          type="radio"
                                          name={`group-${group.id}`}
                                          checked={isSelected}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            toggleIngredient({
                                              ...option,
                                              type: 'selection',
                                              groupId: group.id
                                            });
                                          }}
                                          className="w-3 h-3 sm:w-4 sm:h-4 accent-red-500 flex-shrink-0"
                                        />
                                      )}
                                      <span className="text-[var(--popup-item-text)] truncate text-xs sm:text-sm lg:text-base short:text-xs">{option.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                      {group.type === 'MULTIPLE' && group.type !== 'EXCLUSIONS' && isSelected && (
                                        <div 
                                          className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 border border-gray-200 dark:border-gray-700"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              updateItemQuantity(option.id, option.type, -1);
                                            }}
                                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-all duration-200 flex-shrink-0"
                                          >
                                            -
                                          </button>
                                          <span className="w-6 sm:w-8 lg:w-10 text-center text-[var(--popup-item-text)] font-semibold text-xs sm:text-sm short:text-xs">
                                            {ingredientQuantities[option.id] || 0}
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              updateItemQuantity(option.id, option.type, 1);
                                            }}
                                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-all duration-200 flex-shrink-0"
                                          >
                                            +
                                          </button>
                                        </div>
                                      )}
                                      <div className="min-w-[40px] sm:min-w-[50px] lg:min-w-[60px] text-right">
                                        {option.price > 0 && (
                                          <span className={`text-xs short:text-[10px] ${
                                            group.threshold > 0 && totalSelectedInGroup < group.threshold
                                              ? 'text-green-600 dark:text-green-400' 
                                              : 'text-gray-500'
                                          }`}>
                                            {group.threshold > 0 && totalSelectedInGroup < group.threshold
                                              ? 'Free' 
                                              : `+€${option.price.toFixed(2)}`}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Note Field */}
                    <div className="mt-2 sm:mt-4 lg:mt-6 mb-2 sm:mb-4">
                      <label htmlFor="itemNote" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                        {translations[language].specialInstructions || "Special Instructions"}
                      </label>
                      <textarea
                        id="itemNote"
                        value={itemNote}
                        onChange={(e) => setItemNote(e.target.value)}
                        placeholder={translations[language].addNote || "Add any special instructions or notes..."}
                        className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white text-xs sm:text-sm"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer with Controls */}
              <div className="sticky bottom-0 left-0 right-0 bg-[var(--popup-container-bg)] border-t border-[var(--popup-container-border)] w-full min-w-0 flex-shrink-0">
                <div className="flex w-full px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
                  <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-[var(--popup-button-border)] rounded-lg sm:rounded-xl lg:rounded-2xl bg-[var(--popup-button-bg)] shadow-sm h-10 flex-shrink-0">
                      <button
                        onClick={() => updatePopupItemQuantity(-1)}
                        className="text-sm sm:text-base lg:text-lg font-bold text-[var(--popup-button-text)] px-3 sm:px-4 h-full flex items-center justify-center hover:text-[var(--popup-button-hover-text)] min-w-[40px] sm:min-w-[44px] lg:min-w-[48px] active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-2 sm:px-3 lg:px-4 text-xs sm:text-sm lg:text-md font-semibold h-full flex items-center text-[var(--popup-button-text)] min-w-[32px] text-center">
                        {popupItemQuantity}
                      </span>
                      <button
                        onClick={() => updatePopupItemQuantity(1)}
                        className="text-sm sm:text-base lg:text-lg font-bold text-[var(--popup-button-text)] px-3 sm:px-4 h-full flex items-center justify-center hover:text-[var(--popup-button-hover-text)] min-w-[40px] sm:min-w-[44px] lg:min-w-[48px] active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Basket Button */}
                    <button
                      onClick={handleAddToBasket}
                      className="flex justify-between items-center border border-[var(--popup-button-primary-border)] bg-[var(--popup-button-primary-bg)] text-[var(--popup-button-primary-text)] px-2 sm:px-4 lg:px-6 h-10 rounded-lg sm:rounded-xl lg:rounded-2xl hover:bg-[var(--popup-button-primary-hover-bg)] font-medium shadow-sm min-w-0 flex-1"
                    >
                      <span className="text-xs sm:text-sm flex items-center truncate">
                        {translations[language].addToBasket}
                      </span>
                      <div className="flex flex-col items-end ml-1 sm:ml-2 lg:ml-4 justify-center flex-shrink-0">
                        {displayPrice.discountPercentage > 0 && (
                          <span className="text-xs text-gray-500 line-through">
                            {selectedItem?.currency || '€'}{(displayPrice.originalPrice * popupItemQuantity).toFixed(2)}
                          </span>
                        )}
                        <span className="font-bold text-xs sm:text-sm">
                          {selectedItem?.currency || '€'}{(displayPrice.discountedPrice * popupItemQuantity).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemList;
