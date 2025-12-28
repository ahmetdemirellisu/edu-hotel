import { Navbar } from "./layout/Navbar";
import { Footer } from "./layout/Footer";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Moon,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export function Payment() {
  const navigate = useNavigate();

  // Mock reservation data (in production, this would come from route state or API)
  const reservation = {
    id: 12345,
    checkIn: "2025-12-20",
    checkOut: "2025-12-23",
    pricePerNight: 1200,
  };

  // Calculate nights and total
  const calculateNights = () => {
    const start = new Date(reservation.checkIn);
    const end = new Date(reservation.checkOut);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60 * 24);
  };

  const nights = calculateNights();
  const totalAmount = nights * reservation.pricePerNight;

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Form state
  const [formData, setFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
        .slice(0, 19);
      setFormData({ ...formData, [name]: formatted });
    }
    // Format expiry date
    else if (name === "expiryDate") {
      let formatted = value.replace(/\D/g, "");
      if (formatted.length >= 2) {
        formatted = formatted.slice(0, 2) + "/" + formatted.slice(2, 4);
      }
      setFormData({ ...formData, [name]: formatted });
    }
    // Limit CVV to 3 digits
    else if (name === "cvv") {
      setFormData({ ...formData, [name]: value.slice(0, 3) });
    }
    // Other fields
    else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = "Cardholder name is required";
    }

    const cardNum = formData.cardNumber.replace(/\s/g, "");
    if (!cardNum) {
      newErrors.cardNumber = "Card number is required";
    } else if (cardNum.length !== 16) {
      newErrors.cardNumber = "Card number must be 16 digits";
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = "Invalid format (MM/YY)";
    }

    if (!formData.cvv) {
      newErrors.cvv = "CVV is required";
    } else if (formData.cvv.length !== 3) {
      newErrors.cvv = "CVV must be 3 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle payment submission
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing (frontend only)
    setTimeout(() => {
      setIsProcessing(false);
      // Show success message and redirect
      alert("Payment successful! Your reservation is confirmed.");
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[#003366] hover:text-[#0066cc] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl text-[#003366] mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">
            Your reservation has been approved. Please complete the payment to confirm your booking.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reservation Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-fit">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-xl text-[#003366]">Reservation Summary</h2>
            </div>

            <div className="space-y-4">
              {/* Reservation ID */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CreditCard className="h-5 w-5 text-[#003366]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reservation ID</p>
                  <p className="text-sm text-gray-900 font-medium">#{reservation.id}</p>
                </div>
              </div>

              {/* Check-in */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Check-in</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {formatDate(reservation.checkIn)}
                  </p>
                </div>
              </div>

              {/* Check-out */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Check-out</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {formatDate(reservation.checkOut)}
                  </p>
                </div>
              </div>

              {/* Number of nights */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Moon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Number of Nights</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {nights} {nights === 1 ? "night" : "nights"}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Price breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per night</span>
                  <span className="text-gray-900">₺{reservation.pricePerNight.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Number of nights</span>
                  <span className="text-gray-900">× {nights}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Total amount */}
              <div className="bg-[#003366] text-white rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Amount</span>
                  <span className="text-2xl font-semibold">₺{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Info message */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  Your reservation will be confirmed immediately after successful payment.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl text-[#003366] mb-6">Payment Details</h2>

            <form onSubmit={handlePayment} className="space-y-5">
              {/* Cardholder Name */}
              <div>
                <label htmlFor="cardholderName" className="block text-sm text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  id="cardholderName"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] ${
                    errors.cardholderName ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.cardholderName && (
                  <p className="text-xs text-red-600 mt-1">{errors.cardholderName}</p>
                )}
              </div>

              {/* Card Number */}
              <div>
                <label htmlFor="cardNumber" className="block text-sm text-gray-700 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] ${
                      errors.cardNumber ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    <img
                      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='20' viewBox='0 0 32 20'%3E%3Crect width='32' height='20' rx='3' fill='%231434CB'/%3E%3Ccircle cx='12' cy='10' r='6' fill='%23EB001B'/%3E%3Ccircle cx='20' cy='10' r='6' fill='%23FF5F00'/%3E%3C/svg%3E"
                      alt="Mastercard"
                      className="h-6"
                    />
                    <img
                      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='20' viewBox='0 0 32 20'%3E%3Crect width='32' height='20' rx='3' fill='%231A1F71'/%3E%3Cpath d='M13 6h6l-2 8h-6l2-8z' fill='%23F7B600'/%3E%3C/svg%3E"
                      alt="Visa"
                      className="h-6"
                    />
                  </div>
                </div>
                {errors.cardNumber && (
                  <p className="text-xs text-red-600 mt-1">{errors.cardNumber}</p>
                )}
              </div>

              {/* Expiry Date and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiryDate" className="block text-sm text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] ${
                      errors.expiryDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.expiryDate && (
                    <p className="text-xs text-red-600 mt-1">{errors.expiryDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cvv" className="block text-sm text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleChange}
                    placeholder="123"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] ${
                      errors.cvv ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.cvv && (
                    <p className="text-xs text-red-600 mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Security notice */}
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-green-800">
                  Your payment information is encrypted and secure. We do not store your card details.
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 pt-4">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-xl font-medium transition-all ${
                    isProcessing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#003366] hover:bg-[#004080] text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing Payment...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Pay ₺{totalAmount.toLocaleString()} Now
                    </span>
                  )}
                </button>

                <Link to="/dashboard">
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
