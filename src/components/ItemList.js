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

const ItemList = ({ basketVisible, setBasketVisible }) => {
  const { language, translations } = useLanguage();
  const location = useLocation();
  const [basket, setBasket] = useState([]);
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

  // Initialize basket and order method from navigation state if available
  useEffect(() => {
    if (location.state?.basket) {
      setBasket(location.state.basket);
      setBasketVisible(true);
    }
    if (location.state?.orderMethod) {
      setOrderMethod(location.state.orderMethod);
    }
  }, [location.state, setBasketVisible]);

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
    labels[0] = "PROMOTIONS";
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
    const aOrder = orderMap[parseInt(a)] || 10;
    const bOrder = orderMap[parseInt(b)] || 10;
    return aOrder - bOrder;
  });

  const scrollToSection = (categoryId) => {
    const section = document.getElementById(`category-${categoryId}`);
    if (section) {
      const headerHeight = 96; // Height of the fixed header
      const categoryListHeight = 48; // Height of the category list
      const totalOffset = headerHeight + categoryListHeight;
      
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - totalOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveCategory(categoryId);
    }
  };

  const detectActiveCategory = useCallback(() => {
    const sections = Object.keys(categoryLabels).map((categoryId) =>
      document.getElementById(`category-${categoryId}`)
    );
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

  // Update the calculateTotalPrice function to properly handle all types of selections
  const calculateTotalPrice = useCallback((basePrice, selectedItems, quantity = 1) => {
    // Separate items by type
    const ingredients = selectedItems.filter(item => (item.type === 'ingredient' || item.type === 'selection') && item.selected);
    const drinks = selectedItems.filter(item => item.type === 'drink' && item.selected);
    const sides = selectedItems.filter(item => item.type === 'side' && item.selected);
    const offers = selectedItems.filter(item => item.type === 'offer' && item.selected);

    // Group selections by their group ID to handle thresholds
    const groupedSelections = ingredients.reduce((acc, item) => {
      if (item.groupId) {
        if (!acc[item.groupId]) {
          acc[item.groupId] = [];
        }
        acc[item.groupId].push(item);
      }
      return acc;
    }, {});

    // Calculate total for one item with all selections
    const ingredientsTotal = Object.entries(groupedSelections).reduce((sum, [groupId, items]) => {
      const group = itemOptions?.selectionGroups.find(g => g.id === parseInt(groupId));
      if (!group) return sum;

      // Sort items by quantity to ensure we count the highest quantities first
      const sortedItems = [...items].sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
      
      let totalForGroup = 0;
      let itemsCounted = 0;

      sortedItems.forEach(item => {
        const itemQuantity = item.quantity || 1;
        for (let i = 0; i < itemQuantity; i++) {
          if (itemsCounted < group.threshold) {
            // Free items within threshold
            itemsCounted++;
          } else {
            // Charge for items beyond threshold
            totalForGroup += Number(item.price || 0);
          }
        }
      });

      return sum + totalForGroup;
    }, 0);

    const drinksTotal = drinks.reduce((sum, drink) => {
      const price = Number(drink.price || 0);
      const qty = Number(drink.quantity || 0);
      return sum + (price * qty);
    }, 0);

    const sidesTotal = sides.reduce((sum, side) => {
      const price = Number(side.price || 0);
      const qty = Number(side.quantity || 0);
      return sum + (price * qty);
    }, 0);

    const singleItemTotal = basePrice + ingredientsTotal + drinksTotal + sidesTotal;

    // Find maximum discount from offers
    const maxDiscount = offers.reduce((max, offer) => 
      Math.max(max, Number(offer.discountPercentage || 0)), 0
    );

    // Calculate final price with discount for one item
    const discount = singleItemTotal * (maxDiscount / 100);
    const finalPrice = singleItemTotal - discount;

    console.log('Price calculation:', {
      basePrice,
      ingredientsTotal,
      drinksTotal,
      sidesTotal,
      singleItemTotal,
      discount,
      finalPrice,
      selectedItems: selectedItems.map(item => ({
        name: item.name,
        type: item.type,
        price: item.price,
        quantity: item.quantity,
        selected: item.selected
      }))
    });

    return {
      originalPrice: singleItemTotal,
      discountedPrice: finalPrice,
      discountPercentage: maxDiscount,
      singleItemPrice: singleItemTotal
    };
  }, [api, itemOptions]);

  // Add a function to check if an item is free based on threshold
  const isItemFree = useCallback((item, group) => {
    if (!group || !group.threshold) return false;
    
    const selectedItemsInGroup = selectedIngredients.filter(
      ing => ing.groupId === group.id && ing.type === 'selection'
    );
    
    // Count total items in the group
    const totalItems = selectedItemsInGroup.reduce((sum, ing) => sum + (ing.quantity || 1), 0);
    
    // Find the position of this item in the sorted list
    const sortedItems = [...selectedItemsInGroup].sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
    const itemPosition = sortedItems.findIndex(ing => ing.id === item.id);
    
    // Calculate how many items are before this one
    const itemsBefore = sortedItems.slice(0, itemPosition).reduce((sum, ing) => sum + (ing.quantity || 1), 0);
    
    return itemsBefore < group.threshold;
  }, [selectedIngredients]);

  // Update the option display to show free/paid status
  const renderOptionPrice = useCallback((option, group) => {
    if (!option.price) return <span className="min-w-[60px]"></span>;
    
    const selectedItemsInGroup = selectedIngredients.filter(
      ing => ing.groupId === group.id && ing.type === 'selection'
    );
    
    const totalSelectedItems = selectedItemsInGroup.reduce((sum, ing) => sum + (ing.quantity || 1), 0);
    
    if (totalSelectedItems < group.threshold) {
      return (
        <span className="text-sm text-green-600 dark:text-green-400 min-w-[60px] text-right">
          Free
        </span>
      );
    }
    
    return (
      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
        +{option.price}€
      </span>
    );
  }, [selectedIngredients]);

  // Update the updateIngredientQuantity function to properly handle price updates
  const updateIngredientQuantity = useCallback((ingredient, delta) => {
    setSelectedIngredients(prev => {
      const newIngredients = prev.map(ing => {
        // Check both ID and type to find the correct item
        if (ing.id === ingredient.id) {
          const newQuantity = Math.max(0, (ing.quantity || 0) + delta);
          if (newQuantity === 0) {
            return { ...ing, selected: false };
          }
          return { ...ing, quantity: newQuantity, selected: true };
        }
        return ing;
      }).filter(ing => ing.selected);

      // Update ingredientQuantities state
      setIngredientQuantities(prev => {
        const newQuantities = { ...prev };
        const changedIngredient = newIngredients.find(ing => ing.id === ingredient.id);
        if (changedIngredient) {
          newQuantities[ingredient.id] = changedIngredient.quantity;
        } else {
          delete newQuantities[ingredient.id];
        }
        return newQuantities;
      });

      // Calculate new price immediately
      const newPrice = calculateTotalPrice(
        Number(selectedItem?.price || 0),
        newIngredients,
        Number(popupItemQuantity || 1)
      );

      // Log the price change
      const changedIngredient = prev.find(ing => ing.id === ingredient.id);
      if (changedIngredient) {
        const newQuantity = newIngredients.find(ing => ing.id === ingredient.id)?.quantity || 0;
        console.log(`${changedIngredient.name} x${newQuantity} | Price: $${changedIngredient.price} | TNP: $${newPrice.discountedPrice}`);
      }

      return newIngredients;
    });
  }, [selectedItem, popupItemQuantity, calculateTotalPrice]);

  // Memoize the calculated total price
  const calculatedTotalPrice = useMemo(() => {
    if (!selectedItem || !itemOptions) return { originalPrice: 0, discountedPrice: 0, discountPercentage: 0 };
    return calculateTotalPrice(
      Number(selectedItem?.price || 0),
      selectedIngredients,
      Number(popupItemQuantity || 1)
    );
  }, [selectedItem, selectedIngredients, calculateTotalPrice, popupItemQuantity]);

  // Add a state for the displayed price
  const [displayPrice, setDisplayPrice] = useState({
    originalPrice: 0,
    discountedPrice: 0,
    discountPercentage: 0
  });

  // Update display price whenever calculatedTotalPrice changes
  useEffect(() => {
    setDisplayPrice(calculatedTotalPrice);
  }, [calculatedTotalPrice]);

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

  // Update the toggleIngredient function to check required options after changes
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

  // Update the popupItemQuantity state to trigger price recalculation
  const updatePopupItemQuantity = useCallback((delta) => {
    setPopupItemQuantity(prev => {
      const newQuantity = Math.max(1, prev + delta);
      return newQuantity;
    });
  }, []);

  // Add a new function to handle quantity updates with both ID and type
  const updateItemQuantity = useCallback((itemId, itemType, delta) => {
    setSelectedIngredients(prev => {
      const newIngredients = prev.map(ing => {
        // Check both ID and type to find the correct item
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

      // Log the price change
      const changedItem = prev.find(ing => ing.id === itemId && ing.type === itemType);
      if (changedItem) {
        const newPrice = calculateTotalPrice(
          Number(selectedItem?.price || 0),
          newIngredients,
          Number(popupItemQuantity || 1)
        );
        const newQuantity = newIngredients.find(ing => ing.id === itemId && ing.type === itemType)?.quantity || 0;
        console.log(`${changedItem.name} x${newQuantity} | TNP: $${newPrice.discountedPrice}`);
      }

      return newIngredients;
    });
  }, [selectedItem, popupItemQuantity, calculateTotalPrice]);

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

  // Memoize the handleAddToBasket function
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
      // Find the element with the missing group and scroll to it
      const groupElement = document.getElementById(`group-${missingRequiredGroup.id}`);
      if (groupElement) {
        groupElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Get all selected items from selection groups, attaching groupName
    const selectedItems = [
      // Include items from selection groups
      ...itemOptions.selectionGroups.reduce((acc, group) => {
        const selectedOptions = group.options.filter(opt => opt.selected).map(opt => ({
          ...opt,
          groupName: group.name
        }));
        return [...acc, ...selectedOptions];
      }, []),
      // Include items from selectedIngredients, attach groupName if possible
      ...selectedIngredients.map(ing => {
        // Try to find the group for this ingredient
        let groupName = undefined;
        if (ing.groupId && itemOptions.selectionGroups) {
          const group = itemOptions.selectionGroups.find(g => g.id === ing.groupId);
          if (group) groupName = group.name;
        }
        return {
          ...ing,
          groupName: groupName || ing.groupName // fallback to existing groupName if present
        };
      })
    ];

    const quantity = Number(popupItemQuantity || 1);
    const basePrice = Number(selectedItem?.price || 0);
    
    // Calculate price for a single item first
    const priceCalculation = calculateTotalPrice(
      basePrice,
      selectedItems,
      1  // Calculate for single item first
    );

    const basketItem = {
      id: selectedItem.id,
      name: selectedItem.name,
      basePrice: basePrice,
      originalPrice: priceCalculation.originalPrice,
      quantity: quantity,
      note: itemNote.trim(),
      selectedItems: selectedItems.map(item => ({ 
        ...item, 
        quantity: item.quantity || 1,
        price: Number(item.price || 0)
      })),
      image: selectedItem.image_url,
      selectionKey: JSON.stringify(selectedItems.map(item => ({
        id: item.id,
        type: item.type,
        quantity: item.quantity
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
        // Remove discounts from all items first
        const newBasket = prevBasket.map(item => ({
          ...item,
          discountedPrice: undefined,
          discountPercentage: undefined
        }));
        
        // Then update the quantity of the existing item
        const existingItem = newBasket[existingItemIndex];
        const newQuantity = existingItem.quantity + basketItem.quantity;
        
        newBasket[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          originalPrice: existingItem.originalPrice
        };
        return newBasket;
      });
    } else {
      // Add new item if it doesn't exist or has different selections/note
      setBasket(prevBasket => {
        // Remove discounts from all items
        const newBasket = prevBasket.map(item => ({
          ...item,
          discountedPrice: undefined,
          discountPercentage: undefined
        }));
        return [...newBasket, basketItem];
      });
    }

    setSelectedIngredients([]);
    setIngredientQuantities({});
    setItemNote("");
    setShowPopup(false);
    setShowRequiredOptionsWarning(false);
    document.body.classList.remove('popup-active');
    setBasketVisible(true);
  }, [selectedItem, itemOptions, popupItemQuantity, setBasketVisible, calculateTotalPrice, basket, selectedIngredients, itemNote]);

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
      
      // Calculate total price including selected items
      const selectedItemsTotal = item.selectedItems?.reduce((sum, selected) => {
        return sum + (selected.price * (selected.quantity || 1));
      }, 0) || 0;

      newBasket[index] = {
        ...item,
        quantity: newQuantity,
        originalPrice: item.basePrice + selectedItemsTotal,
        selectedItems: item.selectedItems || [],
        // Remove discount
        discountedPrice: undefined,
        discountPercentage: undefined
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
      
      // Calculate total price including selected items
      const selectedItemsTotal = item.selectedItems?.reduce((sum, selected) => {
        return sum + (selected.price * (selected.quantity || 1));
      }, 0) || 0;

      newBasket[index] = {
        ...item,
        quantity: newQuantity,
        originalPrice: item.basePrice + selectedItemsTotal,
        selectedItems: item.selectedItems || [],
        // Remove discount
        discountedPrice: undefined,
        discountPercentage: undefined
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

  return (
    <div className="min-h-screen bg-[var(--order-bg)] text-[var(--order-text-primary)]">
      <div className="content-container">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[var(--category-header-bg)] fixed top-20 sm:top-24 left-0 w-full z-40 py-2 shadow-[var(--category-header-shadow)]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center w-full lg:max-w-[700px] space-x-4 overflow-x-auto scrollbar-hide">
                  <CategoryCount
                    categories={categoryLabelsWithCount}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    scrollToSection={scrollToSection}
                  />
                </div>
                <div className="relative w-full lg:w-[200px] xl:w-[250px] 2xl:w-[300px] flex items-center">
                  <input
                    type="text"
                    placeholder={` 🔍 ${translations[language].searchMenu}`}
                    className="search-input border-[var(--search-border)] px-4 py-2 text-sm rounded-full shadow-sm focus:ring focus:ring-red-100 focus:outline-none w-full placeholder-[var(--search-placeholder)] bg-[var(--search-bg)] text-[var(--search-text)]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="menu-content-container">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-[160px] md:pt-[180px]">
              {error ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                  <div className="text-red-500 text-4xl mb-2">⚠️</div>
                  <div className="text-red-500 text-center text-lg">{error}</div>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    {translations[language].retry || 'Retry'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-start space-y-8">
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
      </div>
      {/* Basket rendered at the top level, outside all containers */}
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
        />
      )}
      {showPopup && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-30 overflow-hidden">
          <div
            className="w-full max-w-[95vw] sm:max-w-[95vw] md:max-w-[500px] lg:max-w-[600px] flex flex-col mx-auto bg-[var(--popup-container-bg)] rounded-[30px] shadow-lg popup-container"
          >
            <div className="rounded-[30px] text-[var(--popup-header-text)] w-full flex flex-col relative h-full">
              <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                {/* Close button and image in scrollable area */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowPopup(false);
                      setShowRequiredOptionsWarning(false);
                      document.body.classList.remove('popup-active');
                    }}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 w-11 h-11 min-w-[44px] min-h-[44px] bg-[var(--popup-close-button-bg)] text-[var(--popup-close-button-text)] hover:text-[var(--popup-close-button-hover-text)] rounded-full border border-[var(--popup-close-button-border)] flex items-center justify-center shadow-md z-10"
                    style={{ zIndex: 100 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {selectedItem.image_url && (
                    <div className="relative w-full h-[180px] sm:h-[220px] md:h-[300px] flex-shrink-0 rounded-t-[30px] overflow-hidden">
                      <img
                        src={selectedItem.image_url}
                        alt={selectedItem.name || 'Item'}
                        className="w-full h-full object-cover"
                      />
                      {showRequiredOptionsWarning && (
                        <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white py-2 px-4 text-center animate-fade-in">
                          Please select required options
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-2 py-2 sm:px-6 sm:py-4 bg-[var(--popup-content-bg)] text-[var(--popup-content-text)]">
                  <div className="p-2 sm:p-6 mb-4">
                    <h2 className="text-2xl font-bold text-[var(--popup-header-text)] mb-2 text-left">
                      {selectedItem.name || 'Unnamed Item'}
                    </h2>
                    <div className="flex items-center mb-1">
                      <span className="text-lg font-bold text-red-500" style={{ textAlign: 'left' }}>
                        €{selectedItem.price}
                      </span>
                    </div>
                    <p className="text-[var(--popup-content-text)] mb-4 text-left">
                      {selectedItem.description || 'No description available'}
                    </p>

                    <hr className="border-[var(--popup-content-border)] mb-4" />

                    <div className="ingredient-list">
                      <h3 className="text-lg font-semibold mb-2 text-[var(--popup-header-text)]">
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
                        return (
                          <div 
                            key={group.id}
                            id={`group-${group.id}`}
                            className="mb-6"
                          >
                            <h4 className="text-md font-semibold mb-3 text-[var(--popup-header-text)] flex items-center">
                              {group.name}
                              {attentionGroupId === group.id && (
                                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              )}
                              <span className="text-sm font-normal ml-2 text-[var(--popup-content-text)]">
                                ({group.type === 'EXCLUSIONS' ? 'Optional Exclusions' : group.isRequired ? 'Required' : 'Optional'})
                                {group.type === 'MULTIPLE' && group.threshold > 0 && (
                                  <span className="text-[var(--popup-content-text)] ml-2">
                                    (First {group.threshold} {group.name.toLowerCase().endsWith('s') ? group.name.toLowerCase() : group.name.toLowerCase() + 's'} are free)
                                  </span>
                                )}
                              </span>
                            </h4>
                            <div className="space-y-2">
                              {group.options
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((option) => (
                                  <div 
                                    key={`${option.id}-${option.name}`} 
                                    className={`flex items-center justify-between p-2 rounded-lg border border-[var(--popup-item-border)] transition-all duration-200 cursor-pointer
                                      ${selectedIngredients.some(ing => ing.id === option.id && ing.type === 'selection')
                                        ? 'bg-red-100 dark:bg-[var(--popup-item-selected-bg)] text-[var(--popup-item-selected-text)] border-red-300 dark:border-[var(--popup-item-selected-bg)]'
                                        : 'bg-[var(--popup-item-bg)] text-[var(--popup-item-text)] hover:bg-[var(--popup-item-hover-bg)]'}
                                    `}
                                    style={{ minHeight: '56px', marginBottom: '8px' }}
                                    onClick={() => toggleIngredient({
                                      ...option,
                                      type: 'selection',
                                      groupId: group.id
                                    })}
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      {group.type === 'MULTIPLE' ? (
                                        <input
                                          type="checkbox"
                                          checked={selectedIngredients.some(
                                            ing => ing.id === option.id && ing.type === 'selection'
                                          )}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            toggleIngredient({
                                              ...option,
                                              type: 'selection',
                                              groupId: group.id
                                            });
                                          }}
                                          className="w-4 h-4 accent-red-500 flex-shrink-0"
                                        />
                                      ) : (
                                        <input
                                          type="radio"
                                          name={`group-${group.id}`}
                                          checked={selectedIngredients.some(
                                            ing => ing.id === option.id && ing.type === 'selection'
                                          )}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            toggleIngredient({
                                              ...option,
                                              type: 'selection',
                                              groupId: group.id
                                            });
                                          }}
                                          className="w-4 h-4 accent-red-500 flex-shrink-0"
                                        />
                                      )}
                                      <span className="text-[var(--popup-item-text)] truncate">{option.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {group.type === 'MULTIPLE' && group.type !== 'EXCLUSIONS' && selectedIngredients.some(
                                        ing => ing.id === option.id && ing.type === 'selection'
                                      ) && (
                                        <div 
                                          className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-full px-1 sm:px-2 py-1 border border-gray-200 dark:border-gray-700"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              updateIngredientQuantity({
                                                ...option,
                                                type: 'selection',
                                                groupId: group.id
                                              }, -1);
                                            }}
                                            className="w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-base sm:text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                          >
                                            -
                                          </button>
                                          <span className="w-4 sm:w-6 text-center text-[var(--popup-item-text)] font-semibold text-sm sm:text-base">
                                            {ingredientQuantities[option.id] || 0}
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              updateIngredientQuantity({
                                                ...option,
                                                type: 'selection',
                                                groupId: group.id
                                              }, 1);
                                            }}
                                            className="w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-base sm:text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                          >
                                            +
                                          </button>
                                        </div>
                                      )}
                                      <div className="min-w-[60px] text-right">
                                        {renderOptionPrice(option, group)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Note Field */}
                    <div className="mt-6 mb-4">
                      <label htmlFor="itemNote" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {translations[language].specialInstructions || "Special Instructions"}
                      </label>
                      <textarea
                        id="itemNote"
                        value={itemNote}
                        onChange={(e) => setItemNote(e.target.value)}
                        placeholder={translations[language].addNote || "Add any special instructions or notes..."}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 left-0 right-0 bg-[var(--popup-container-bg)] border-t border-[var(--popup-container-border)] w-full min-w-0">
                <div className="flex w-full px-2 sm:px-6">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center border border-[var(--popup-button-border)] rounded-2xl bg-[var(--popup-button-bg)] shadow-sm h-10">
                      <button
                        onClick={() => updatePopupItemQuantity(-1)}
                        className="text-lg font-bold text-[var(--popup-button-text)] px-3 h-full flex items-center hover:text-[var(--popup-button-hover-text)] min-w-[44px] min-h-[44px]"
                      >
                        -
                      </button>
                      <span className="px-3 text-md font-semibold h-full flex items-center">
                        {popupItemQuantity}
                      </span>
                      <button
                        onClick={() => updatePopupItemQuantity(1)}
                        className="text-lg font-bold text-[var(--popup-button-text)] px-3 h-full flex items-center hover:text-[var(--popup-button-hover-text)] min-w-[44px] min-h-[44px]"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={handleAddToBasket}
                      className="flex justify-between items-center border border-[var(--popup-button-primary-border)] bg-[var(--popup-button-primary-bg)] text-[var(--popup-button-primary-text)] px-6 h-10 rounded-2xl hover:bg-[var(--popup-button-primary-hover-bg)] font-medium shadow-sm min-w-0 w-full sm:w-auto ml-2"
                      style={{ maxWidth: '320px' }}
                    >
                      <span className="text-sm flex items-center">
                        {translations[language].addToBasket}
                      </span>
                      <div className="flex flex-col items-end ml-4 justify-center">
                        {displayPrice.discountPercentage > 0 && (
                          <span className="text-sm text-gray-500 line-through">
                            €{(displayPrice.originalPrice * popupItemQuantity).toFixed(2)}
                          </span>
                        )}
                        <span className="font-bold">
                          €{(displayPrice.discountedPrice * popupItemQuantity).toFixed(2)}
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
