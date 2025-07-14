const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load the proto file
const packageDefinition = protoLoader.loadSync('./src/seats/proto/seat.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const seatProto = grpc.loadPackageDefinition(packageDefinition).seat;

// Create client
const client = new seatProto.SeatService(
  'localhost:50054',
  grpc.credentials.createInsecure()
);

// Test functions
async function testGetSeatLayout() {
  console.log('Testing GetSeatLayout...');
  return new Promise((resolve, reject) => {
    client.GetSeatLayout({ roomId: 'sample-room-id' }, (error, response) => {
      if (error) {
        console.error('GetSeatLayout error:', error);
        reject(error);
      } else {
        console.log('GetSeatLayout response:', response);
        resolve(response);
      }
    });
  });
}

async function testGetSeatStatus() {
  console.log('Testing GetSeatStatus...');
  return new Promise((resolve, reject) => {
    client.GetSeatStatus({ showtimeId: 'sample-showtime-id' }, (error, response) => {
      if (error) {
        console.error('GetSeatStatus error:', error);
        reject(error);
      } else {
        console.log('GetSeatStatus response:', response);
        resolve(response);
      }
    });
  });
}

async function testHoldSeats() {
  console.log('Testing HoldSeats...');
  return new Promise((resolve, reject) => {
    client.HoldSeats({
      showtimeId: 'sample-showtime-id',
      seatIds: ['seat-1', 'seat-2'],
      userId: 'user-123',
      holdDurationMinutes: 5
    }, (error, response) => {
      if (error) {
        console.error('HoldSeats error:', error);
        reject(error);
      } else {
        console.log('HoldSeats response:', response);
        resolve(response);
      }
    });
  });
}

async function testBookSeats() {
  console.log('Testing BookSeats...');
  return new Promise((resolve, reject) => {
    client.BookSeats({
      showtimeId: 'sample-showtime-id',
      seatIds: ['seat-1', 'seat-2'],
      userId: 'user-123',
      bookingId: 'booking-456'
    }, (error, response) => {
      if (error) {
        console.error('BookSeats error:', error);
        reject(error);
      } else {
        console.log('BookSeats response:', response);
        resolve(response);
      }
    });
  });
}

async function testReleaseSeats() {
  console.log('Testing ReleaseSeats...');
  return new Promise((resolve, reject) => {
    client.ReleaseSeats({
      showtimeId: 'sample-showtime-id',
      seatIds: ['seat-1', 'seat-2'],
      userId: 'user-123'
    }, (error, response) => {
      if (error) {
        console.error('ReleaseSeats error:', error);
        reject(error);
      } else {
        console.log('ReleaseSeats response:', response);
        resolve(response);
      }
    });
  });
}

// Run tests
async function runTests() {
  try {
    console.log('Starting seat service tests...\n');

    await testGetSeatLayout();
    console.log('');

    await testGetSeatStatus();
    console.log('');

    await testHoldSeats();
    console.log('');

    await testBookSeats();
    console.log('');

    await testReleaseSeats();
    console.log('');

    console.log('All tests completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testGetSeatLayout,
  testGetSeatStatus,
  testHoldSeats,
  testBookSeats,
  testReleaseSeats,
  runTests
};