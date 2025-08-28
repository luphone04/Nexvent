-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ATTENDEE', 'ORGANIZER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."EventCategory" AS ENUM ('CONFERENCE', 'WORKSHOP', 'SEMINAR', 'SOCIAL', 'SPORTS', 'CONCERT', 'MEETUP', 'TRAINING');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('REGISTERED', 'WAITLISTED', 'CANCELLED', 'ATTENDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organization" TEXT,
    "bio" TEXT,
    "interests" TEXT[],
    "role" "public"."UserRole" NOT NULL DEFAULT 'ATTENDEE',
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_date" TIMESTAMP(3) NOT NULL,
    "event_time" TEXT,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "category" "public"."EventCategory" NOT NULL,
    "ticket_price" MONEY NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "status" "public"."EventStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organizer_id" TEXT NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."registrations" (
    "id" TEXT NOT NULL,
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "check_in_code" TEXT NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "waitlist_position" INTEGER,
    "special_requirements" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "event_id" TEXT NOT NULL,
    "attendee_id" TEXT NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "events_event_date_idx" ON "public"."events"("event_date");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "public"."events"("category");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "public"."events"("status");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "public"."events"("organizer_id");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_check_in_code_key" ON "public"."registrations"("check_in_code");

-- CreateIndex
CREATE INDEX "registrations_event_id_idx" ON "public"."registrations"("event_id");

-- CreateIndex
CREATE INDEX "registrations_attendee_id_idx" ON "public"."registrations"("attendee_id");

-- CreateIndex
CREATE INDEX "registrations_status_idx" ON "public"."registrations"("status");

-- CreateIndex
CREATE INDEX "registrations_check_in_code_idx" ON "public"."registrations"("check_in_code");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_event_id_attendee_id_key" ON "public"."registrations"("event_id", "attendee_id");

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registrations" ADD CONSTRAINT "registrations_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
