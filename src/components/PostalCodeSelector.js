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
    setAddresses([]);
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
        house: '', // House number will be entered by user
        stairs: '',
        stick: '',
        door: '',
        bell: '',
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
    return address.Street || '';
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
    <div className="space-y-6">
      <div>
        <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {postcodeLabel}
        </label>
        <select
          id="postcode"
          value={selectedPostcode}
          onChange={(e) => handlePostcodeChange(Number(e.target.value))}
          ref={postalCodeRef}
          className="block w-full h-responsive-input rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-responsive-base dark:bg-gray-700 dark:text-white"
          style={{ height: 'var(--input-height)', minHeight: 'var(--input-height)' }}
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
        <div className="space-y-6 mt-8">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {addressLabel}
            </label>
            <select
              id="address"
              value={selectedAddress}
              onChange={(e) => handleAddressChange(Number(e.target.value))}
              ref={addressRef}
              className="block w-full h-responsive-input rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-responsive-base dark:bg-gray-700 dark:text-white"
              disabled={loading}
              style={{ height: 'var(--input-height)', minHeight: 'var(--input-height)' }}
            >
              <option value="">{selectAddressLabel}</option>
              {addresses.map((address) => (
                <option key={address.Id} value={address.Id}>
                  {formatAddress(address)}
                </option>
              ))}
            </select>
            {loading && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {loadingLabel}
              </p>
            )}
          </div>

          {selectedAddress && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              <div className="h-responsive-selector">
                <label htmlFor="house" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {houseLabel}
                </label>
                <input
                  type="text"
                  id="house"
                  value={formValues.house}
                  onChange={(e) => handleFieldChange('house', e.target.value)}
                  onBlur={handleFieldBlur}
                  ref={houseRef}
                  className="block w-full h-responsive-input rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-responsive-base dark:bg-gray-700 dark:text-white"
                  placeholder="Nr."
                  required
                  style={{ height: 'var(--input-height)', minHeight: 'var(--input-height)' }}
                />
              </div>

              <div className="h-responsive-selector">
                <label htmlFor="stairs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {stairsLabel}
                </label>
                <input
                  type="text"
                  id="stairs"
                  value={formValues.stairs}
                  onChange={(e) => handleFieldChange('stairs', e.target.value)}
                  onBlur={handleFieldBlur}
                  className="block w-full h-responsive-input rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-responsive-base dark:bg-gray-700 dark:text-white"
                  placeholder="Stiege"
                  style={{ height: 'var(--input-height)', minHeight: 'var(--input-height)' }}
                />
              </div>

              <div className="h-responsive-selector">
                <label htmlFor="stick" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {stickLabel}
                </label>
                <input
                  type="text"
                  id="stick"
                  value={formValues.stick}
                  onChange={(e) => handleFieldChange('stick', e.target.value)}
                  onBlur={handleFieldBlur}
                  className="block w-full h-responsive-input rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-responsive-base dark:bg-gray-700 dark:text-white"
                  placeholder="Stock"
                  style={{ height: 'var(--input-height)', minHeight: 'var(--input-height)' }}
                />
              </div>

              <div className="h-responsive-selector">
                <label htmlFor="door" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {doorLabel}
                </label>
                <input
                  type="text"
                  id="door"
                  value={formValues.door}
                  onChange={(e) => handleFieldChange('door', e.target.value)}
                  onBlur={handleFieldBlur}
                  className="block w-full h-responsive-input rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-responsive-base dark:bg-gray-700 dark:text-white"
                  placeholder="Tür"
                  style={{ height: 'var(--input-height)', minHeight: 'var(--input-height)' }}
                />
              </div>

              <div className="h-responsive-selector sm:col-span-2">
                <label htmlFor="bell" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {bellLabel}
                </label>
                <input
                  type="text"
                  id="bell"
                  value={formValues.bell}
                  onChange={(e) => handleFieldChange('bell', e.target.value)}
                  onBlur={handleFieldBlur}
                  className="block w-full h-responsive-input rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-responsive-base dark:bg-gray-700 dark:text-white"
                  placeholder="Klingel"
                  style={{ height: 'var(--input-height)', minHeight: 'var(--input-height)' }}
                />
              </div>
            </div>
          )}
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