# Contest Tracker - Implementation Documentation

## 1. Project Overview

I developed a full-stack MERN (MongoDB, Express, React, Node.js) application that fetches and displays programming contests from Codeforces, CodeChef, and LeetCode. The application allows users to:

- View upcoming, ongoing, and past coding contests
- Filter contests by platform
- Bookmark contests for quick access
- Set email reminders for contests
- Add YouTube solution links to past contests (admin feature)
- Manage user accounts (admin feature)

## 2. System Architecture

### 2.1 Backend Components

- **Database**: MongoDB with Mongoose ODM
- **Server**: Express.js with Node.js
- **Authentication**: JWT-based auth with bcrypt for password hashing
- **APIs**: RESTful endpoints for contests, bookmarks, reminders, and user management
- **Contest Data Fetching**: Multiple strategies including API calls and web scraping
- **Email Service**: Nodemailer for sending contest reminders
- **Scheduled Jobs**: Node-cron for scheduling reminders and data updates

### 2.2 Frontend Components

- **Framework**: React with functional components and hooks
- **State Management**: Redux Toolkit for global state
- **Routing**: React Router v6 with protected routes
- **Styling**: CSS with dark/light theme support
- **UI Components**: Custom-built components for contest display, filtering, etc.

## 3. Implementation Details

### 3.1 Backend Implementation

#### 3.1.1 Database Models

I created four main MongoDB models:

1. **User**: Stores user authentication details with role-based permissions (user/admin)
2. **Contest**: Stores contest information including platform, status, timing details
3. **Bookmark**: Links users to contests they've bookmarked
4. **Reminder**: Stores reminder preferences for specific contests

#### 3.1.2 Contest Data Fetching Strategy

One of the more complex parts of the implementation was reliably fetching contest data from different platforms, each with different data structures and availability:

- **Codeforces**: Primary method uses their API (`contest.list`), with a fallback to HTML scraping
- **LeetCode**: Primary method uses GraphQL API, with a fallback to HTML scraping
- **CodeChef**: Due to no official API, implemented two approaches:
  1. Puppeteer-based scraping for headless browser interaction
  2. HTML parsing with Cheerio as a fallback

To increase reliability, I implemented:

- Multiple fallback strategies
- Error handling with informative logging
- Random delays between requests to avoid rate limiting
- Content validation to ensure correct data extraction

Additionally, I designed a system to automatically update contest statuses (upcoming → ongoing → past) based on start and end times.

#### 3.1.3 Authentication and Authorization

- JWT-based authentication with tokens stored in local storage
- Role-based access control (regular users vs admins)
- Password hashing with bcrypt
- Protected routes on both frontend and backend

#### 3.1.4 API Rate Limiting

To prevent abuse, I added rate limiting using `express-rate-limit` with a default of 100 requests per 15-minute window across all API routes.

### 3.2 Frontend Implementation

#### 3.2.1 State Management

Used Redux Toolkit with:

- Separate slices for contests, bookmarks, reminders, and auth
- Async thunks for API communications
- Local persistence for auth state with redux-persist

#### 3.2.2 Component Architecture

- **ContestList**: Main container for viewing and filtering contests
- **ContestItem**: Reusable card component for individual contests
- **FilterPanel**: Contest filtering interface
- **Bookmarks**: User's bookmarked contests view
- **Reminder System**: UI for setting contest reminders
- **Admin Panels**: Solution URL management and user management

#### 3.2.3 UI/UX Features

- **Responsive Design**: Works on mobile and desktop
- **Dark/Light Theme**: Implemented context-based theme switching
- **Loading States**: Spinners and loading indicators during data fetching
- **Error Handling**: User-friendly error messages with retry options
- **Time Formatting**: Human-readable time remaining for contests

### 3.3 Email Reminder System

I implemented a complete reminder system that:

1. Allows users to set reminders for 30 minutes or 1 hour before contest start
2. Uses node-cron to check every minute for contests that need notifications
3. Generates and sends HTML emails with contest details
4. Tracks sent reminders to prevent duplicates

### 3.4 Admin Features

1. **User Management**:

   - View all users
   - Delete user accounts
   - Create new admin accounts

2. **Solution Management**:
   - Add YouTube solution URLs to past contests
   - Filter contests by platform and name
   - Update solution links for previously added solutions

## 4. Technical Challenges and Solutions

### 4.1 Contest Data Reliability

**Challenge**: Different platforms structure data differently, and sometimes APIs change or are unavailable.

**Solution**:

- Implemented multiple fallback strategies
- Created detailed logging for debugging
- Added robust error handling

### 4.2 Date and Time Handling

**Challenge**: Dealing with different timezone formats across platforms.

**Solution**:

- Standardized all dates to ISO format
- Implemented special handling for CodeChef's IST timezone
- Added validation to ensure consistent date handling

### 4.3 Database Performance

**Challenge**: Optimizing database queries for faster response times.

**Solution**:

- Created appropriate indexes on frequently queried fields
- Used MongoDB compound indexes for unique constraints
- Implemented query filtering strategies to limit result sets

### 4.4 Security Concerns

**Challenge**: Protecting sensitive data and preventing unauthorized access.

**Solution**:

- Implemented JWT with appropriate expiration
- Added rate limiting to all APIs
- Used proper input validation and sanitization
- Added MongoDB query sanitization to prevent injection attacks

## 5. Future Improvements

While the current implementation meets the requirements, here are areas I would enhance with more time:

1. **Real-time Updates**: Implement WebSockets for real-time contest status updates
2. **Additional Platform Support**: Add support for more coding platforms (AtCoder, HackerRank, etc.)
3. **Advanced Filtering**: Add more filtering options (duration, difficulty level if available)
4. **Automated Solution Linking**: Automatically match YouTube uploads to contests
5. **Mobile App**: Develop a React Native version for better mobile experience
6. **Notifications**: Add push notifications for browsers and mobile
7. **Analytics**: Track user engagement and contest popularity
8. **Accessibility**: Enhance accessibility features for screen readers and keyboard navigation

## 6. Security Considerations

I've identified a few security issues that should be addressed before production deployment:

1. In `default.json`, there's a hardcoded JWT secret and MongoDB connection string. In a production environment, these should be moved to environment variables.
2. The MongoDB connection string contains credentials. This should be secured and not committed to version control.
3. There are email credentials in the configuration that should be secured.

## 7. Testing Strategy

For this project, I implemented:

- Manual testing of all features
- Error case testing with invalid inputs
- Fallback testing by intentionally failing primary data sources

With more time, I would add:

- Unit tests for utility functions
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Component tests for React components

## 8. Deployment Readiness

The application is nearly production-ready with a few adjustments needed:

1. Move sensitive configuration to environment variables
2. Set up proper logging and monitoring
3. Implement a CI/CD pipeline for automated testing and deployment
4. Add appropriate caching strategies
5. Configure proper CORS settings for production
6. Optimize build processes for frontend assets
