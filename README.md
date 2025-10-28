# 🎬 Movie Ticket Booking System

A modern, scalable microservices-based movie ticket booking platform built with NestJS, featuring real-time seat management, distributed transaction orchestration, and event-driven architecture.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)

## 🚀 Features

### 🎯 Core Functionality
- **🎬 Movie Catalog**: Browse movies, view showtimes, and theater information
- **🪑 Real-time Seat Selection**: Interactive seat layout with live availability updates
- **🎫 Complete Booking Flow**: End-to-end ticket booking with payment processing
- **💳 Payment Integration**: Mock payment gateway with webhook support
- **📧 Automated Notifications**: Email confirmations and booking updates
- **⏰ Smart Timeout Management**: Automatic seat release and booking timeouts

### 🏗️ Architecture Highlights
- **Microservices Architecture**: 7 independent services with clear boundaries
- **Event-Driven Communication**: Asynchronous messaging with RabbitMQ
- **Saga Pattern**: Distributed transaction orchestration for booking workflows
- **Real-time Updates**: Live seat availability and booking status
- **Fault Tolerance**: Graceful error handling and compensation mechanisms

## 🏛️ System Architecture

```mermaid
graph TB
    Client[Client Application] --> Gateway[API Gateway :3005]

    Gateway --> Auth[Auth Service :50051]
    Gateway --> Movie[Movie Service :50053]
    Gateway --> Seat[Seat Service :50054]
    Gateway --> Booking[Booking Service :50055]
    Gateway --> Payment[Payment Service]

    Booking --> Saga[Saga Orchestrator :50056]
    Saga --> Notification[Notification Service :50052]

    Auth --> AuthDB[(Auth DB)]
    Movie --> MovieDB[(Movie DB)]
    Seat --> SeatDB[(Seat DB)]
    Booking --> BookingDB[(Booking DB)]
    Saga --> SagaDB[(Saga DB)]

    Seat --> Redis[(Redis Cache)]
    Booking --> Redis

    Saga --> RabbitMQ[RabbitMQ]
    Notification --> RabbitMQ
    Booking --> RabbitMQ
    Seat --> RabbitMQ
```

## 🛠️ Technology Stack

### Backend Services
- **Framework**: NestJS (Node.js/TypeScript)
- **Communication**: gRPC, HTTP REST
- **Database**: PostgreSQL (multiple instances)
- **Caching**: Redis
- **Message Queue**: RabbitMQ
- **Authentication**: JWT

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Message Broker**: RabbitMQ 3

## 📁 Project Structure

```
ticket-booking/
├── services/
│   ├── api-gateway/          # API Gateway (Port 3005)
│   ├── auth-service/         # Authentication Service (Port 50051)
│   ├── movie-service/        # Movie Catalog Service (Port 50053)
│   ├── seat-service/         # Seat Management Service (Port 50054)
│   ├── booking-service/      # Booking Service (Port 50055)
│   ├── saga-orchestrator/    # Saga Orchestrator (Port 50056)
│   └── notification-service/  # Notification Service (Port 50052)
├── docker-compose.yml        # Docker Compose configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ticket-booking
```

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
# Database Configuration
AUTH_DB_HOST=postgres-auth
AUTH_DB_PORT=5432
AUTH_DB_USERNAME=postgres
AUTH_DB_PASSWORD=password
AUTH_DB_NAME=auth_db

MOVIE_DB_HOST=postgres-movie
MOVIE_DB_PORT=5432
MOVIE_DB_USERNAME=postgres
MOVIE_DB_PASSWORD=password
MOVIE_DB_NAME=movie_db

SEAT_DB_HOST=postgres-seat
SEAT_DB_PORT=5432
SEAT_DB_USERNAME=postgres
SEAT_DB_PASSWORD=password
SEAT_DB_NAME=seat_db

BOOKING_DB_HOST=postgres-booking
BOOKING_DB_PORT=5432
BOOKING_DB_USERNAME=postgres
BOOKING_DB_PASSWORD=password
BOOKING_DB_NAME=booking_db

SAGA_ORCHESTRATOR_DB_HOST=postgres-saga-orchestrator
SAGA_ORCHESTRATOR_DB_PORT=5432
SAGA_ORCHESTRATOR_DB_USERNAME=postgres
SAGA_ORCHESTRATOR_DB_PASSWORD=password
SAGA_ORCHESTRATOR_DB_NAME=saga_db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# API Gateway
API_GATEWAY_URL=http://localhost:3005

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Start the System
```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 4. Verify Installation
```bash
# Check if all services are running
docker-compose ps
```

## 🔧 Services Overview

### 🌐 API Gateway (Port 3005)
- **Purpose**: Single entry point for all client requests
- **Features**: Authentication, request routing, load balancing
- **Endpoints**: RESTful API for all operations

### 🔐 Auth Service (Port 50051)
- **Purpose**: User authentication and authorization
- **Features**: JWT token management, user registration/login
- **Database**: User credentials and profiles

### 🎬 Movie Service (Port 50053)
- **Purpose**: Movie catalog and showtime management
- **Features**: Movie browsing, showtime scheduling, theater management
- **Database**: Movies, showtimes, rooms, theaters

### 🪑 Seat Service (Port 50054)
- **Purpose**: Real-time seat management
- **Features**: Seat layout, availability tracking, seat holding
- **Cache**: Redis for real-time seat availability
- **Database**: Seat layouts and booking states

### 🎫 Booking Service (Port 50055)
- **Purpose**: Booking lifecycle management
- **Features**: Booking creation, payment coordination, timeout handling
- **Database**: Booking transactions and items

### 🔄 Saga Orchestrator (Port 50056)
- **Purpose**: Distributed transaction coordination
- **Features**: Event-driven workflows, compensation handling
- **Pattern**: Saga pattern for distributed transactions

### 📧 Notification Service (Port 50052)
- **Purpose**: Automated notifications
- **Features**: Email notifications, booking confirmations
- **Integration**: SMTP for email delivery

Note: Saga events are published/consumed via RabbitMQ queue `saga_events_queue`.

## 📊 API Endpoints

### Authentication
```http
POST /auth/register
POST /auth/login
POST /auth/validate
```

### Movies & Showtimes
```http
GET /movies
GET /movies/:id/showtimes
GET /showtimes
```

### Seat Management
```http
GET /seats/layout/:roomId
GET /seats/status/:showtimeId
POST /seats/hold
POST /seats/book
POST /seats/release
```

### Booking Management
```http
GET /bookings
GET /bookings/:id
```

### Payment Processing
```http
POST /payment/pay
POST /payment/callback
```

Notes:
- When running under Docker, the Payment Service sends webhook callbacks to the API Gateway using the internal hostname (container-to-container) and port mapping. Externally, you should access the gateway via `http://localhost:3005`.

## 🔄 Booking Flow

### 1. User Authentication
```mermaid
sequenceDiagram
    participant U as User
    participant G as API Gateway
    participant A as Auth Service

    U->>G: POST /auth/login
    G->>A: Validate credentials
    A->>G: JWT token
    G->>U: Authentication success
```

### 2. Seat Selection & Booking
```mermaid
sequenceDiagram
    participant U as User
    participant G as API Gateway
    participant S as Seat Service
    participant B as Booking Service
    participant SO as Saga Orchestrator

    U->>G: Select seats
    G->>S: Hold seats
    S->>G: Seats held
    G->>B: Create booking
    B->>SO: Start saga
    SO->>B: Booking created
    G->>U: Booking confirmation
```

### 3. Payment & Confirmation
```mermaid
sequenceDiagram
    participant U as User
    participant G as API Gateway
    participant P as Payment Service
    participant SO as Saga Orchestrator
    participant S as Seat Service
    participant N as Notification Service

    U->>G: Process payment
    G->>P: Payment request
    P->>SO: Payment success event
    SO->>S: Confirm seats
    S->>SO: Seats confirmed
    SO->>N: Send notification
    N->>U: Booking confirmation email
```








---

