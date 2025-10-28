/**
 * Saga Action Handlers
 *
 * This module contains action handlers that implement the business logic
 * for different types of saga events. Each handler is responsible for
 * a specific type of event and contains all the logic needed to process
 * that event.
 *
 * The SagaService directly calls these handlers based on the event type,
 * providing a simple and straightforward approach without unnecessary
 * abstraction layers.
 *
 * Benefits of this architecture:
 * - Separation of concerns: Each handler focuses on one type of event
 * - Easy to test: Each handler can be tested independently
 * - Easy to maintain: Changes to one event type don't affect others
 * - Easy to extend: New event types can be added by creating new handlers
 * - Clear responsibility: It's obvious which handler handles which event
 * - Simple and direct: No unnecessary factory pattern complexity
 */

export { BaseActionHandler } from './base-action.handler';
export { PaymentSuccessActionHandler } from './payment-success.action.handler';
export { PaymentFailedActionHandler } from './payment-failed.action.handler';
export { BookingConfirmedActionHandler } from './booking-confirmed.action.handler';
export { SeatConfirmedActionHandler } from './seat-confirmed.action.handler';
