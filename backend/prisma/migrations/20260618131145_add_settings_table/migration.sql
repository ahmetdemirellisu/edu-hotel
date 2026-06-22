-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "hotelName" TEXT NOT NULL DEFAULT 'EDU Hotel',
    "contactEmail" TEXT NOT NULL DEFAULT 'hotel@sabanciuniv.edu',
    "contactPhone" TEXT NOT NULL DEFAULT '+90 (216) 483 9000',
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 30,
    "maxStayNights" INTEGER NOT NULL DEFAULT 5,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "bankName" TEXT NOT NULL DEFAULT 'Akbank T.A.Ş.',
    "accountHolder" TEXT NOT NULL DEFAULT 'Sabtek A.Ş.',
    "iban" TEXT NOT NULL DEFAULT 'TR85 0004 6007 1388 8000 1139 89',
    "checkInTime" TEXT NOT NULL DEFAULT '14:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '12:00',
    "wifiSsid" TEXT NOT NULL DEFAULT 'EDU-Hotel-Guest',
    "wifiPassword" TEXT NOT NULL DEFAULT 'Welcome2026',
    "breakfastHours" TEXT NOT NULL DEFAULT '07:30 – 10:00',
    "receptionHours" TEXT NOT NULL DEFAULT '24/7',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
