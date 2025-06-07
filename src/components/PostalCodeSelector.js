import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../LanguageContext';
import { useApi } from '../contexts/ApiContext';

const PostalCodeSelector = ({ onPostalCodeChange, onAddressChange, refs }) => {
  const { language, translations } = useLanguage();
  const { api } = useApi();
  const [postcodes, setPostcodes] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedPostcode, setSelectedPostcode] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({
    street: '',
    house: '',
    stairs: '',
    stick: '',
    door: '',
    bell: '',
    specialNotes: ''
  });
  
  // Use refs from props
  const { postalCode: postalCodeRef, address: addressRef, house: houseRef } = refs || {};
  
  // Add ref to track if we're currently typing
  const isTypingRef = useRef(false);
  // Add ref to store the latest form values
  const formValuesRef = useRef(formValues);

  // Update ref when form values change
  useEffect(() => {
    formValuesRef.current = formValues;
  }, [formValues]);

  // Add debounced update function
  const debouncedUpdate = useCallback((newValues) => {
    if (onAddressChange) {
      onAddressChange(newValues);
    }
  }, [onAddressChange]);

  useEffect(() => {
    const fetchPostcodes = async () => {
      if (postcodes.length > 0) return; // Don't fetch if we already have postcodes
      try {
        const response = await api.get('/Postcode');
        setPostcodes(response.data || []);
      } catch (err) {
        setError(translations[language].checkout.error.fetchingPostcodes || 'Error fetching postcodes');
      }
    };
    fetchPostcodes();
  }, [api, language, translations, postcodes.length]);

  const fetchAddresses = useCallback(async (postcode) => {
    if (!postcode) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/Postcode/${postcode}/addresses`);
      console.log('Addresses response:', response.data);
      setAddresses(response.data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError(translations[language].checkout.error.fetchingAddresses || 'Error fetching addresses');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [api, language, translations]);

  useEffect(() => {
    if (selectedPostcode && !addresses.length) {
      fetchAddresses(selectedPostcode);
    }
  }, [selectedPostcode, addresses.length, fetchAddresses]);

  const handlePostcodeChange = (postcodeId) => {
    setSelectedPostcode(postcodeId);
    setSelectedAddress('');
    const newFormValues = {
      street: '',
      house: '',
      stairs: '',
      stick: '',
      door: '',
      bell: '',
      specialNotes: ''
    };
    setFormValues(newFormValues);
    formValuesRef.current = newFormValues;
    const selectedPostcodeData = postcodes.find(p => p.Id === postcodeId);
    if (selectedPostcodeData && onPostalCodeChange) {
      onPostalCodeChange(selectedPostcodeData.Code);
    }
  };

  const handleAddressChange = (addressId) => {
    setSelectedAddress(addressId);
    const address = addresses.find(a => a.Id === addressId);
    console.log('Selected address:', address);
    if (address) {
      const newFormValues = {
        street: address.Street || '',
        house: address.House || '',
        stairs: address.Stairs || '',
        stick: address.Stick || '',
        door: address.Door || '',
        bell: address.Bell || '',
        specialNotes: ''
      };
      setFormValues(newFormValues);
      formValuesRef.current = newFormValues;
      if (onAddressChange) {
        onAddressChange(newFormValues);
      }
    }
  };

  const handleFieldChange = (field, value) => {
    isTypingRef.current = true;
    setFormValues(prev => {
      const newValues = {
        ...prev,
        [field]: value
      };
      formValuesRef.current = newValues;
      return newValues;
    });
  };

  const handleFieldBlur = () => {
    if (!isTypingRef.current) return; // Don't trigger if we're not actually typing
    isTypingRef.current = false;
    if (onAddressChange) {
      onAddressChange(formValuesRef.current);
    }
  };

  const formatAddress = (address) => {
    console.log('Formatting address:', address);
    const parts = [];
    if (address.Street) parts.push(address.Street);
    if (address.House && address.House !== 'null') parts.push(address.House);
    if (address.Stairs && address.Stairs !== 'null') parts.push(`Stiege ${address.Stairs}`);
    if (address.Stick && address.Stick !== 'null') parts.push(`${address.Stick}. Stock`);
    if (address.Door && address.Door !== 'null') parts.push(`Tür ${address.Door}`);
    if (address.Bell && address.Bell !== 'null') parts.push(`Klingel ${address.Bell}`);
    return parts.join(', ');
  };

  const postcodeLabel = translations[language]?.checkout?.postalCode || 'Postal Code';
  const selectPostcodeLabel = translations[language]?.checkout?.selectPostalCode || 'Select Postal Code';
  const addressLabel = translations[language]?.checkout?.address || 'Address';
  const selectAddressLabel = translations[language]?.checkout?.selectAddress || 'Select Address';
  const loadingLabel = translations[language]?.checkout?.loading || 'Loading...';
  const houseLabel = translations[language]?.checkout?.house || 'House Number';
  const stairsLabel = translations[language]?.checkout?.stairs || 'Stairs (optional)';
  const stickLabel = translations[language]?.checkout?.stick || 'Floor (optional)';
  const doorLabel = translations[language]?.checkout?.door || 'Door';
  const bellLabel = translations[language]?.checkout?.bell || 'Bell (optional)';

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {postcodeLabel}
        </label>
        <select
          id="postcode"
          value={selectedPostcode}
          onChange={(e) => handlePostcodeChange(Number(e.target.value))}
          ref={postalCodeRef}
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
        >
          <option value="">{selectPostcodeLabel}</option>
          {postcodes.map((postcode) => (
            <option key={postcode.Id} value={postcode.Id}>
              {postcode.Code} - {postcode.District}
            </option>
          ))}
        </select>
      </div>

      {selectedPostcode && (
        <div className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {addressLabel}
            </label>
            <select
              id="address"
              value={selectedAddress}
              onChange={(e) => handleAddressChange(Number(e.target.value))}
              ref={addressRef}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              disabled={loading}
            >
              <option value="">{selectAddressLabel}</option>
              {addresses.map((address) => (
                <option key={address.Id} value={address.Id}>
                  {formatAddress(address)}
                </option>
              ))}
            </select>
            {loading && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {loadingLabel}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="h-[72px]">
              <label htmlFor="house" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {houseLabel}
              </label>
              <input
                type="text"
                id="house"
                value={formValues.house}
                onChange={(e) => handleFieldChange('house', e.target.value)}
                onBlur={handleFieldBlur}
                ref={houseRef}
                className="block w-full h-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Nr."
              />
            </div>
            <div className="h-[72px]">
              <label htmlFor="stairs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {stairsLabel}
              </label>
              <input
                type="text"
                id="stairs"
                value={formValues.stairs}
                onChange={(e) => handleFieldChange('stairs', e.target.value)}
                onBlur={handleFieldBlur}
                className="block w-full h-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Stiege"
              />
            </div>
            <div className="h-[72px]">
              <label htmlFor="stick" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {stickLabel}
              </label>
              <input
                type="text"
                id="stick"
                value={formValues.stick}
                onChange={(e) => handleFieldChange('stick', e.target.value)}
                onBlur={handleFieldBlur}
                className="block w-full h-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Stock"
              />
            </div>
            <div className="h-[72px]">
              <label htmlFor="door" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {doorLabel}
              </label>
              <input
                type="text"
                id="door"
                value={formValues.door}
                onChange={(e) => handleFieldChange('door', e.target.value)}
                onBlur={handleFieldBlur}
                className="block w-full h-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Tür"
              />
            </div>
            <div className="h-[72px]">
              <label htmlFor="bell" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {bellLabel}
              </label>
              <input
                type="text"
                id="bell"
                value={formValues.bell}
                onChange={(e) => handleFieldChange('bell', e.target.value)}
                onBlur={handleFieldBlur}
                className="block w-full h-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Klingel"
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default PostalCodeSelector; 