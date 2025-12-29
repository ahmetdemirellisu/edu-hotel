import { Navbar } from "./layout/Navbar";
import { Footer } from "./layout/Footer";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // Added i18n
import { getMyLatestReservation, type Reservation } from "../api/reservations";

import {
  CalendarDays,
  Moon,
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
  const { t, i18n } = useTranslation()// Initialize Translation
  const navigate = useNavigate();

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

  const calculateNights = () => {
    if (!reservation) return 0;
    const start = new Date(reservation.checkIn);
    const end = new Date(reservation.checkOut);
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const pricePerNight = 1200;
  const totalAmount = nights * pricePerNight;

  const formatDate = (dateStr: string) => {
    const currentLang = i18n.language === "tr" ? "tr-TR" : "en-GB";
    
    return new Date(dateStr).toLocaleDateString(currentLang, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setUploadError(t("payment.errors.invalidFormat"));
      return;
    }
    if (file.size > maxSize) {
      setUploadError(t("payment.errors.tooLarge"));
      return;
    }

    setUploadedFile(file);
    setUploadError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile || !reservation) return;

    setIsSubmitting(true);
    const formData = new FormData();
    
    // Use "dekont" to match the 'payment.js' upload.single('dekont')
    formData.append("dekont", uploadedFile);

    try {
      /**
       * FIX: Use Port 3000 (from your error log) 
       * and "/payment" (from your app.use in app.js)
       */
      const response = await fetch(`http://localhost:3000/payment/upload-dekont/${reservation.id}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert(t("payment.success"));
        navigate("/dashboard");
      } else {
        const errData = await response.json();
        setUploadError(errData.error || "Upload failed");
      }
    } catch (err) {
      setUploadError("Could not connect to server. Check if backend is running on port 3000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!reservation) return <div className="min-h-screen flex items-center justify-center">{t("payment.errors.noReservation")}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl text-[#003366] mb-2">{t("payment.title")}</h1>
          <p className="text-gray-600">{t("payment.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h2 className="text-xl text-[#003366]">{t("payment.summary")}</h2>
              </div>

              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  {t(`dashboard.status.${reservation.status.toLowerCase()}`, { defaultValue: reservation.status })} – {t("payment.awaiting")}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-lg"><CreditCard className="h-5 w-5 text-[#003366]" /></div>
                  <div>
                    <p className="text-xs text-gray-500">{t("payment.resId")}</p>
                    <p className="text-sm text-gray-900 font-medium">#{reservation.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-lg"><CalendarDays className="h-5 w-5 text-green-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">{t("payment.checkIn")}</p>
                    <p className="text-sm text-gray-900 font-medium">{formatDate(reservation.checkIn)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-orange-100 p-2 rounded-lg"><CalendarDays className="h-5 w-5 text-orange-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">{t("payment.checkOut")}</p>
                    <p className="text-sm text-gray-900 font-medium">{formatDate(reservation.checkOut)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-purple-100 p-2 rounded-lg"><Moon className="h-5 w-5 text-purple-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">{t("payment.nights")}</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {nights} {t("payment.night", { count: nights })}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-4"></div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("payment.pricePerNight")}</span>
                    <span className="text-gray-900">₺{pricePerNight.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("payment.nights")}</span>
                    <span className="text-gray-900">× {nights}</span>
                  </div>
                </div>

                <div className="bg-[#003366] text-white rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t("payment.total")}</span>
                    <span className="text-2xl font-semibold">₺{totalAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-blue-200 mt-2">{t("payment.currency")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="h-6 w-6 text-[#003366]" />
                <h2 className="text-xl text-[#003366]">{t("payment.bankInfo")}</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t("payment.bankName")}</p>
                  <p className="text-sm text-gray-900 font-medium">Akbank T.A.Ş.</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t("payment.accountHolder")}</p>
                  <p className="text-sm text-gray-900 font-medium">Sabancı University EDU Hotel</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t("payment.iban")}</p>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 font-mono">TR33 0004 6004 8888 8000 0123 45</div>
                </div>
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
                  {t("payment.paymentRef", { id: reservation.id })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Upload className="h-6 w-6 text-[#003366]" />
                <h2 className="text-xl text-[#003366]">{t("payment.uploadTitle")}</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block text-sm text-gray-700 mb-3">{t("payment.uploadLabel")}</label>
                {!uploadedFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) validateAndSetFile(file); }}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? "border-[#003366] bg-blue-50" : "border-gray-300"}`}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">{t("payment.dragDrop")}</p>
                    <label className="px-4 py-2 bg-[#003366] text-white rounded-lg cursor-pointer hover:bg-[#004080] transition">
                      {t("payment.browse")}
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const file = e.target.files?.[0]; if (file) validateAndSetFile(file); }} />
                    </label>
                    <p className="text-xs text-gray-500 mt-3">{t("payment.acceptedFormats")}</p>
                  </div>
                ) : (
                  <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4 flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                    </div>
                    <button type="button" onClick={() => setUploadedFile(null)} className="p-2 hover:bg-red-100 rounded-lg"><X className="h-5 w-5 text-red-600" /></button>
                  </div>
                )}
                {uploadError && <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{uploadError}</p>}
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  {t("payment.adminReview")}
                </div>

                <button
                  type="submit"
                  disabled={!uploadedFile || isSubmitting}
                  className={`w-full py-4 rounded-xl font-medium text-white transition-all ${!uploadedFile || isSubmitting ? "bg-gray-300" : "bg-[#003366] hover:bg-[#004080]"}`}
                >
                  {isSubmitting ? t("payment.submitting") : t("payment.submitBtn")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}