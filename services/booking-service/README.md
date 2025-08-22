# Booking Service

## Overview
The Booking Service manages movie ticket bookings in the microservices architecture. It handles the complete booking lifecycle from creation to confirmation or failure.

## New Feature: Seat Event Timeout Mechanism

### How it works
1. **Booking Confirmation**: When a booking is confirmed (status changes to PAID), a `confirm_expired_time` is set to 1 minute from the current time.

2. **Scheduled Check**: Every 30 seconds, a scheduled job runs to check for expired bookings.

3. **Timeout Handling**: If a booking remains in PAID status after the expiration time:
   - Status is changed to FAILED
   - `confirm_expired_time` is cleared
   - `booking_failed` event is emitted
   - Seats are released via seat service events

### Database Changes
- Added `confirm_expired_time` column to the `bookings` table
- This column stores the timestamp when the booking confirmation expires

### Events Emitted
- `booking_confirmed`: When a booking is confirmed
- `booking_failed`: When a booking times out or fails
- `booking_canceled`: When a booking is manually canceled
- `booking_canceled` (seat service): To release seats when canceled

### Configuration
- Timeout duration: 1 minute (60 seconds)
- Check frequency: Every 30 seconds
- Expired bookings are automatically marked as FAILED

### Dependencies
- `@nestjs/schedule`: For cron job scheduling
- TypeORM: For database operations
- RabbitMQ: For event messaging

## API Endpoints
- `POST /bookings` - Create a new booking
- `GET /bookings` - List user bookings
- `GET /bookings/:id` - Get specific booking
- `POST /bookings/:id/pay` - Process payment
- `POST /bookings/:id/confirm` - Confirm booking
- `POST /bookings/:id/cancel` - Cancel booking

## Environment Variables
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `RABBITMQ_URL`
- `REDIS_URL`
