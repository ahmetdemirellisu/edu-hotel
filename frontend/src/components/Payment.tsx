import { Navbar } from "./layout/Navbar";
import { Footer } from "./layout/Footer";
import { useState, useEffect } from "react"; // Added useEffect
import { Link, useNavigate } from "react-router-dom";
// Added API import to match your project
import { getMyLatestReservation, type Reservation } from "../api/reservations";

import {
  CalendarDays,
  Moon,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Building2,
  CreditCard,
  X,
  CheckCircle2,
} from "lucide-react";

export function Payment() {
  const navigate = useNavigate();

  // --- START BACKEND CONNECTION ---
  const userId = Number(localStorage.getItem("userId"));
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReservation() {
      if (!userId || isNaN(userId)) {
        setLoading(false);
        return;
      }
      try {
        const res = await getMyLatestReservation(userId);
        setReservation(res);
      } catch (err) {
        console.error("Failed to load reservation", err);
      } finally {
        setLoading(false);
      }
    }
    loadReservation();
  }, [userId]);
  // --- END BACKEND CONNECTION ---

  // Calculate nights and total
  const calculateNights = () => {
    if (!reservation) return 0; // Guard for null
    const start = new Date(reservation.checkIn);
    const end = new Date(reservation.checkOut);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60 * 24);
  };

  const nights = calculateNights();
  const pricePerNight = 1200; // Matching your dashboard rate
  const totalAmount = nights * pricePerNight;

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // Validate file
  const validateAndSetFile = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file format. Please upload PDF, JPG, or PNG.");
      return;
    }

    if (file.size > maxSize) {
      setUploadError("File size exceeds 5MB. Please upload a smaller file.");
      return;
    }

    setUploadedFile(file);
    setUploadError("");
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadError("");
  };

  // --- UPDATED SUBMIT HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile || !reservation) {
      setUploadError("Please upload a payment receipt.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("receipt", uploadedFile);
    formData.append("reservationId", reservation.id.toString());

    try {
      const response = await fetch("http://localhost:5000/api/payments/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Payment receipt submitted successfully!");
        navigate("/dashboard");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      setUploadError("Failed to upload receipt. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    return <FileText className="h-8 w-8 text-blue-600" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!reservation) {
    return <div className="min-h-screen flex items-center justify-center">No active reservation found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-[#003366] mb-2">Payment & Confirmation</h1>
          <p className="text-gray-600">
            Complete your payment via bank transfer and upload your receipt for verification.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Reservation Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h2 className="text-xl text-[#003366]">Reservation Summary</h2>
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  {reservation.status} – Awaiting Payment
                </span>
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
                    <p className="text-xs text-gray-500">Check-in Date</p>
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
                    <p className="text-xs text-gray-500">Check-out Date</p>
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
                    <span className="text-gray-900">₺{pricePerNight.toLocaleString()}</span>
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
                  <p className="text-xs text-blue-200 mt-2">Currency: Turkish Lira (TRY)</p>
                </div>
              </div>

              {/* Important Notice */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium mb-1">Important Information</p>
                    <p className="text-xs text-blue-800">
                      Your reservation has been approved. Please complete the payment via bank transfer
                      and upload your receipt to finalize your booking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Instructions & Upload */}
          <div className="space-y-6">
            {/* Bank Transfer Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="h-6 w-6 text-[#003366]" />
                <h2 className="text-xl text-[#003366]">Bank Transfer Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                  <p className="text-sm text-gray-900 font-medium">Akbank T.A.Ş.</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Account Holder</p>
                  <p className="text-sm text-gray-900 font-medium">Sabancı University EDU Hotel</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">IBAN</p>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-900 font-mono font-medium">
                      TR33 0004 6004 8888 8000 0123 45
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Currency</p>
                  <p className="text-sm text-gray-900 font-medium">TRY (₺)</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Amount to Transfer</p>
                  <div className="bg-[#003366] text-white rounded-lg p-3">
                    <p className="text-lg font-semibold">₺{totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Payment Reference Notice */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-900 font-medium mb-1">Important</p>
                    <p className="text-xs text-yellow-800">
                      Please use your Reservation ID <strong>#{reservation.id}</strong> as the payment
                      reference/description when making the transfer.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Payment Receipt */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Upload className="h-6 w-6 text-[#003366]" />
                <h2 className="text-xl text-[#003366]">Upload Payment Receipt</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* File Upload Area */}
                <div>
                  <label className="block text-sm text-gray-700 mb-3">
                    Upload Payment Receipt (Dekont)
                  </label>

                  {!uploadedFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                        isDragging
                          ? "border-[#003366] bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">
                        Drag and drop your receipt here, or
                      </p>
                      <label className="inline-block">
                        <span className="px-4 py-2 bg-[#003366] text-white rounded-lg cursor-pointer hover:bg-[#004080] transition">
                          Browse Files
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-3">
                        Accepted formats: PDF, JPG, PNG (Max 5MB)
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(uploadedFile)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium truncate">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-2 hover:bg-red-100 rounded-lg transition"
                        >
                          <X className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {uploadError}
                    </p>
                  )}
                </div>

                {/* Admin Review Notice */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      After uploading your receipt, the administration will review and confirm your
                      payment. You will receive an email notification once your payment is verified.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <button
                    type="submit"
                    disabled={!uploadedFile || isSubmitting}
                    className={`w-full py-4 rounded-xl font-medium transition-all ${
                      !uploadedFile || isSubmitting
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#003366] hover:bg-[#004080] text-white shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {isSubmitting ? (
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
                        Submitting Receipt...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Upload className="h-5 w-5" />
                        Submit Receipt for Review
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}