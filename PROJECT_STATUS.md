# Adaptonia Backend - Project Status

## Overview
Adaptonia Backend is a RESTful API built with NestJS, providing authentication, user management, messaging, and group communication services. The application uses Prisma ORM with a MySQL database for data persistence and follows a modular architecture.

## Technology Stack
- **Framework**: NestJS v11
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT, Passport (with Google OAuth strategy)
- **Testing**: Jest
- **Documentation**: Swagger
- **Planned Real-Time**: WebSockets (via @nestjs/websockets)

## Project Structure
- **src/auth/**: Authentication module with JWT, Google OAuth integration
- **src/user/**: User management module
- **src/prisma/**: Prisma service and database connection
- **src/chat/**: Direct messaging functionality
  - Controller for REST endpoints
  - Service for business logic
  - DTOs for request/response validation
- **src/channel/**: Group/channel communication system
  - Controller for channel management endpoints
  - Service for channel business logic
  - DTOs for channel operations
- **src/goals/**: User goals and task management
- **src/common/**: Shared utilities and common code

## Database Schema
- **User**: Contains user data with authentication methods (credentials, Google, Apple)
- **PasswordReset**: Manages password reset tokens and verification
- **Message**: Unified model for both direct and channel messages
- **Channel**: Represents group communication spaces with different types
- **ChannelMember**: Manages user memberships and roles in channels
- **Goal**: User goals and tasks with categories and tracking

## Communication Architecture
- **Direct Messaging**: One-to-one messages between users
  - Message creation with sender/receiver relationship
  - Message read status tracking
  - Recent conversations listing
- **Channel System**: Many-to-many group communication
  - Different channel types (GROUP, DISCUSSION, SUPPORT, ANNOUNCEMENTS)
  - Role-based permissions (OWNER, ADMIN, MODERATOR, MEMBER)
  - Public and private channel support

## Security & Access Control
- JWT authentication for all API endpoints
- Role-based authorization for channel operations
- Proper error handling and input validation using DTOs
- Secure password reset flow

## Current Status
- Basic user authentication implemented (JWT, Google OAuth)
- User management API endpoints available
- Password reset functionality complete
- Direct messaging system fully implemented
- Channel/group communication system operational
- Database migrations configured with Prisma
- Testing infrastructure in place with Jest

## Deployment
- Configured for deployment (includes start:render script for Render deployment)
- Environment variables required for database and auth configuration

## Next Steps
- Implement WebSocket gateway for real-time messaging
  - Create ChatGateway for handling socket events
  - Implement message broadcasting to relevant users
  - Add online status tracking
- Enhance authentication security
- Add more comprehensive test coverage
- Complete API documentation with Swagger
- Optimize database queries for performance
- Implement message pagination for large conversations 