import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // ✅ Import Heroicons
import Header from "../components/Header";
import { useLanguage } from "../LanguageContext"; // ✅ Import language context
import axios from "axios"; // Import axios

const SignUp = () => {
  const navigate = useNavigate(); // Navigation hook

  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    postalCode: "",
    address: "",
    house: "",
    stairs: "",
    stick: "",
    door: "",
    bell: "",
    comment: "",
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { language, toggleLanguage, translations } = useLanguage();

  // ✅ Clears the form fields
  const resetForm = () => {
    setFormData({
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      postalCode: "",
      address: "",
      house: "",
      stairs: "",
      stick: "",
      door: "",
      bell: "",
      comment: "",
      agreeTerms: false,
    });
  };

  // ✅ Cancels the sign-up (Navigates to a different page or does nothing)
  const handleCancel = () => {
    navigate("/"); // Or any other action you want to take on cancel (e.g., navigate to the home page)
  };

  // Handle Sign Up Form Submission
  const handleSignUp = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Ensure required fields are filled
    if (
      !formData.email ||
      !formData.phone ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.agreeTerms
    ) {
      alert("Please fill out all required fields.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5019/api/Authentication/signup", formData);
      const token = response.data.token;
      localStorage.setItem("token", token);
      navigate("/"); // Redirect after successful sign-up
    } catch (error) {
      if (error.response) {
        // Server-side error handling
        console.error("Backend error:", error.response.data);
        const validationErrors = error.response.data.errors;
        
        // Handle specific validation errors
        if (validationErrors) {
          let errorMessage = "";
          for (let field in validationErrors) {
            errorMessage += `${field}: ${validationErrors[field].join(', ')}\n`;
          }
          alert("Validation errors:\n" + errorMessage);
        } else {
          alert("Error during sign-up: " + error.response.data.title);
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        alert("No response from server. Please try again.");
      } else {
        console.error("Error:", error.message);
        alert("Error during sign-up. Please try again.");
      }
    }
  };

  return (
    <div className="bg-white-500 min-h-responsive-screen flex items-center justify-center">
      <Header showAuthButtons={false} />

      {/* Centered Registration Form */}
      <div className="bg-white p-responsive rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-responsive-2xl font-bold text-gray-600 text-center mb-responsive">
          {translations[language].registration}
        </h2>

        {/* Start of the Form Tag */}
        <form onSubmit={handleSignUp}>
          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-responsive">
            <input
              type="text"
              className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-sm"
              placeholder={translations[language].phoneNumber}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <input
              type="email"
              className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-sm"
              placeholder={translations[language].email}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-2 gap-responsive mt-responsive">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-sm pr-10"
                placeholder={translations[language].password}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-responsive-sm"
              >
                {showPassword ? <EyeIcon className="h-responsive-icon w-responsive-icon" /> : <EyeSlashIcon className="h-responsive-icon w-responsive-icon" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-sm pr-10"
                placeholder={translations[language].confirmPassword}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-responsive-sm"
              >
                {showConfirmPassword ? <EyeIcon className="h-responsive-icon w-responsive-icon" /> : <EyeSlashIcon className="h-responsive-icon w-responsive-icon" />}
              </button>
            </div>
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-responsive mt-responsive">
            <input
              type="text"
              className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-sm"
              placeholder={translations[language].firstName}
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <input
              type="text"
              className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-sm"
              placeholder={translations[language].lastName}
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          {/* Postal Code & Address */}
          <div className="grid grid-cols-2 gap-responsive mt-responsive">
            <input
              type="text"
              className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-sm"
              placeholder={translations[language].postalCode}
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            />
            <input
              type="text"
              className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-sm"
              placeholder={translations[language].address}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-3 gap-responsive mt-responsive">
            <input
              type="text"
              className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-sm"
              placeholder={translations[language].house}
              value={formData.house}
              onChange={(e) => setFormData({ ...formData, house: e.target.value })}
            />
            <input
              type="text"
              className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-xs"
              placeholder={translations[language].stairs}
              value={formData.stairs}
              onChange={(e) => setFormData({ ...formData, stairs: e.target.value })}
            />
            <input
              type="text"
              className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-xs"
              placeholder={translations[language].stick}
              value={formData.stick}
              onChange={(e) => setFormData({ ...formData, stick: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-responsive mt-responsive">
            <input
              type="text"
              className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-sm"
              placeholder={translations[language].door}
              value={formData.door}
              onChange={(e) => setFormData({ ...formData, door: e.target.value })}
            />
            <input
              type="text"
              className="border px-responsive py-responsive rounded-md w-full placeholder-gray-400 text-responsive-xs"
              placeholder={translations[language].bell}
              value={formData.bell}
              onChange={(e) => setFormData({ ...formData, bell: e.target.value })}
            />
          </div>

          {/* COMMENT BOX */}
          <div className="mt-responsive">
            <textarea
              className="border px-responsive py-responsive rounded-md w-full h-responsive-textarea placeholder-gray-400 text-responsive-xs"
              placeholder={translations[language].comment}
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            ></textarea>
          </div>

          {/* Terms & Conditions */}
          <label className="flex items-center text-responsive-sm text-gray-600 mt-responsive">
            <input
              type="checkbox"
              className="mr-2"
              checked={formData.agreeTerms}
              onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
            />
            {translations[language].agreeTerms}
          </label>

          {/* Buttons */}
          <div className="flex justify-between mt-responsive">
            <div className="flex space-x-responsive">
              <button
                type="button"
                onClick={resetForm}
                className="text-responsive-sm border border-gray-500 bg-white px-responsive py-responsive rounded-lg hover:bg-gray-200"
              >
                {translations[language].reset}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="text-responsive-sm border border-gray-500 bg-white px-responsive py-responsive rounded-lg hover:bg-red-200"
              >
                {translations[language].cancel}
              </button>
            </div>

            <button
              type="submit"
              className="text-responsive-sm border border-gray-500 bg-white px-responsive py-responsive rounded-lg hover:bg-green-200"
            >
              {translations[language].completeRegistration}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
