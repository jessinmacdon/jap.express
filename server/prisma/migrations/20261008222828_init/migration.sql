-- CreateEnum
CREATE TYPE "Lang" AS ENUM ('en', 'fr');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('todo', 'checking', 'done', 'rejected');

-- CreateEnum
CREATE TYPE "SellerType" AS ENUM ('private', 'dealer');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('auto', 'manual');

-- CreateEnum
CREATE TYPE "Fuel" AS ENUM ('petrol', 'diesel', 'hybrid', 'electric');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('new', 'excellent', 'good', 'fair');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'pending_payment', 'active', 'paused', 'expired', 'sold');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('requested', 'accepted', 'confirmed', 'declined', 'cancelled', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('mtn_momo', 'orange_money', 'card', 'paypal');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('booking', 'listing_package');

-- CreateEnum
CREATE TYPE "ListingPackage" AS ENUM ('basic', 'featured');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('pending', 'countered', 'accepted', 'declined', 'withdrawn');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "ListingKind" AS ENUM ('rent', 'sale');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "lang" "Lang" NOT NULL DEFAULT 'en',
    "autoTranslate" BOOLEAN NOT NULL DEFAULT true,
    "goals" TEXT[],
    "homeLabel" TEXT,
    "avatarUrl" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "idStatus" "VerificationStatus" NOT NULL DEFAULT 'todo',
    "licenceStatus" "VerificationStatus" NOT NULL DEFAULT 'todo',
    "selfieStatus" "VerificationStatus" NOT NULL DEFAULT 'todo',
    "sellerType" "SellerType" NOT NULL DEFAULT 'private',
    "businessName" TEXT,
    "areaLabel" TEXT,
    "payoutMethod" "PaymentMethod",
    "payoutMsisdn" TEXT,
    "responseNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileUrls" TEXT[],
    "status" "VerificationStatus" NOT NULL DEFAULT 'checking',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalListing" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'active',
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileageKm" INTEGER,
    "condition" "Condition" NOT NULL DEFAULT 'good',
    "city" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "fuel" "Fuel" NOT NULL,
    "dailyRate" INTEGER NOT NULL,
    "deposit" INTEGER NOT NULL DEFAULT 100000,
    "weeklyDiscount" BOOLEAN NOT NULL DEFAULT false,
    "deliveryAirport" BOOLEAN NOT NULL DEFAULT false,
    "deliveryAirportFee" INTEGER NOT NULL DEFAULT 5000,
    "deliveryCity" BOOLEAN NOT NULL DEFAULT false,
    "deliveryCityFee" INTEGER NOT NULL DEFAULT 3000,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLon" DOUBLE PRECISION NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupNote" TEXT,
    "description" TEXT,
    "descriptionLang" "Lang" NOT NULL DEFAULT 'fr',
    "photos" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tripsCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'active',
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileageKm" INTEGER NOT NULL,
    "fuel" "Fuel" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "color" TEXT NOT NULL,
    "condition" "Condition" NOT NULL,
    "seats" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT NOT NULL,
    "viewLat" DOUBLE PRECISION NOT NULL,
    "viewLon" DOUBLE PRECISION NOT NULL,
    "viewAddress" TEXT NOT NULL,
    "viewingDays" TEXT[],
    "description" TEXT,
    "descriptionLang" "Lang" NOT NULL DEFAULT 'en',
    "photos" TEXT[],
    "views" INTEGER NOT NULL DEFAULT 0,
    "package" "ListingPackage" NOT NULL DEFAULT 'basic',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'requested',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "days" INTEGER NOT NULL,
    "delivery" BOOLEAN NOT NULL DEFAULT false,
    "deliveryTo" TEXT,
    "note" TEXT,
    "dailyRate" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "deliveryFee" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "deposit" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "hostPayout" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "bookingId" TEXT,
    "saleListingId" TEXT,
    "method" "PaymentMethod" NOT NULL,
    "msisdn" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "msisdn" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "saleListingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "counterAmount" INTEGER,
    "status" "OfferStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favourite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ListingKind" NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favourite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "kind" "ListingKind" NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT,
    "lang" "Lang" NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTranslation" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "lang" "Lang" NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "MessageTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingTranslation" (
    "id" TEXT NOT NULL,
    "listingKey" TEXT NOT NULL,
    "lang" "Lang" NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ListingTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "bodyFr" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "OtpCode_phone_createdAt_idx" ON "OtpCode"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "RentalListing_city_status_idx" ON "RentalListing"("city", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedDate_rentalId_date_key" ON "BlockedDate"("rentalId", "date");

-- CreateIndex
CREATE INDEX "SaleListing_city_status_idx" ON "SaleListing"("city", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

-- CreateIndex
CREATE INDEX "Booking_renterId_idx" ON "Booking"("renterId");

-- CreateIndex
CREATE INDEX "Booking_rentalId_status_idx" ON "Booking"("rentalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Favourite_userId_kind_listingId_key" ON "Favourite"("userId", "kind", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_conversationId_userId_key" ON "Participant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTranslation_messageId_lang_key" ON "MessageTranslation"("messageId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "ListingTranslation_listingKey_lang_key" ON "ListingTranslation"("listingKey", "lang");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalListing" ADD CONSTRAINT "RentalListing_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDate" ADD CONSTRAINT "BlockedDate_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "RentalListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleListing" ADD CONSTRAINT "SaleListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "RentalListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_saleListingId_fkey" FOREIGN KEY ("saleListingId") REFERENCES "SaleListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTranslation" ADD CONSTRAINT "MessageTranslation_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
