# Backend Feature Audit Report

This document outlines the current state of existing features in the Zippy Car Rental Backend. The focus is strictly on identifying flaws, missing logic, edge cases, and areas of refinement within the *already implemented* features, without proposing entirely new functionalities.

## 1. Car Listing & Availability (`car.controller.js`)

**Current State:** Hosts can add cars, update details (RC, Insurance, Images, Fastag), and set availability (self-drive, intercity, both) along with pricing.

**Issues & Refinements Needed:**
- **No Date Filtering on Listing:** The `getCars` API returns all cars regardless of whether they are currently booked or not. It lacks the logic to filter out cars that have active or overlapping bookings for a user's requested date range. This means a user could try to book a car that is actually unavailable.
- **Incomplete Soft Delete Logic:** The `deleteCar` function handles soft-deleting (hiding) cars if they have booking history. However, `getCars` does not check for `is_visible: true` before returning cars. Hidden cars will still appear in the main listing.
- **Weak Validation on Availability Update:** When a host updates availability (`updateAvailability`), there is no check to see if the new availability structure conflicts with *already existing* upcoming bookings. A host could change a car to "not available" or change pricing while a guest already has a future booking confirmed.

## 2. Booking System (`booking.controller.js` & related)

**Current State:** Handles guest and host bookings, including Self-Drive and Intercity modes. Stores pickup and drop details.

**Issues & Refinements Needed:**
- **Race Conditions in Booking Creation:** If two users try to book the exact same car for the exact same dates simultaneously, the current implementation (assuming standard Sequelize `create` without robust locking mechanisms) might allow double-booking. Transactionable locks or strict constraint checks are needed during the booking creation phase.
- **Missing Status Integrity Checks:** A booking status can potentially be updated to `COMPLETED` even if the payment status is `PENDING`. There needs to be strict state machine validation (e.g., cannot complete a trip if not paid, cannot start a trip if pickup OTP is not verified).
- **Price Calculation Discrepancies:** The total amount calculation logic (base rate * hours/days) must be strictly enforced on the backend. Relying on frontend calculations passing the `total_amount` is a major security risk. The backend should recalculate the price based on `car.price_per_hour` and the `start/end datetime` before saving.

## 3. KYC & Document Verification (`userDocument.controller.js`)

**Current State:** Users upload Aadhar/DL, admins manually approve or reject them.

**Issues & Refinements Needed:**
- **Inconsistent Re-upload State:** `uploadDocument` allows a user to upload a new image if one exists, setting the status back to `Pending`. However, if the user was already `is_verified: true` because of their previous documents, this API *does not* revert their main user profile `is_verified` status to `false`. A user could replace a valid DL with a fake one and remain verified system-wide until an admin checks it.
- **Missing Expiry Handling:** Documents like Driving Licenses have expiry dates. The current model doesn't seem to track or act on document expiry. A user verified a year ago might now have an expired DL, but the system still considers them `is_verified: true`.

## 4. OTP System & Jobs (`pickupOTP.job.js`, `dropOTP.job.js`)

**Current State:** Background jobs generate or manage OTPs for trip start/end.

**Issues & Refinements Needed:**
- **Job Reliability & Scaling:** Using `node-cron` in the same Express instance means if the server restarts or crashes, scheduled tasks in memory might be missed or run multiple times if multiple instances of the server are deployed (e.g., in a PM2 cluster or auto-scaling group). A persistent job queue (like BullMQ with Redis) is required for production-level reliability.
- **OTP Expiry/Resend Limits:** There is often missing logic for rate-limiting OTP generation. A malicious user could spam the OTP generation endpoints, leading to high SMS costs or system overload.

## 5. Payment Flow (`payment.controller.js`)

**Current State:** Integrates Razorpay. Creates orders and verifies signatures to complete bookings.

**Issues & Refinements Needed:**
- **Partial Payments & Refunds:** The system assumes a binary PAID/UNPAID state. If a booking is cancelled, there is no integrated logic to initiate a refund via Razorpay APIs. It requires manual intervention.
- **Missing Webhook Implementation:** Relying solely on the client to call `verifyPayment` is dangerous. If the user closes the app immediately after paying on Razorpay but before `verifyPayment` is called, the money is deducted from the user, but the backend thinks the booking is unpaid. A Razorpay Server-to-Server Webhook must be implemented to catch these edge cases.
