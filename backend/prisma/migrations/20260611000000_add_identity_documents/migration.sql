-- CreateTable
CREATE TABLE "IdentityDocument" (
    "id"            SERIAL          NOT NULL,
    "reservationId" INTEGER         NOT NULL,
    "guestIndex"    INTEGER         NOT NULL,
    "fileName"      TEXT            NOT NULL,
    "mimeType"      TEXT            NOT NULL,
    "sizeBytes"     INTEGER         NOT NULL,
    "uploadedAt"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityDocument_reservationId_guestIndex_key"
    ON "IdentityDocument"("reservationId", "guestIndex");

-- AddForeignKey
ALTER TABLE "IdentityDocument"
    ADD CONSTRAINT "IdentityDocument_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
