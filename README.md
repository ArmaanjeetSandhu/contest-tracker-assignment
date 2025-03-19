# Contest Tracker 

## 1. Assignment Overview

This is a full-stack web application designed to help competitive programmers track and manage coding contests across multiple platforms. The application aggregates contest information from Codeforces, CodeChef, and LeetCode, providing a centralized hub for users to view upcoming, ongoing, and past contests.

Key features include:

- Real-time contest updates with status tracking
- User authentication and authorization
- Contest bookmarking system
- Email reminder notifications for upcoming contests
- Admin panel for user management and content moderation
- Filter contests by platform and status
- Toggle between card and table views for contests

## 2. System Architecture

### Technology Stack

**Backend**:

- Node.js with Express.js framework
- MongoDB database with Mongoose ODM
- JWT for authentication
- Nodemailer for email services
- Axios for HTTP requests
- Cheerio for web scraping
- Node-cron for scheduling tasks

**Frontend**:

- React.js for UI components
- Redux for state management
- Redux Toolkit for simplified Redux logic
- React Router for navigation
- Axios for API requests
- date-fns for date formatting and calculations

### System Components

1. **Contest Fetcher Service**: Periodically fetches contest data from multiple platforms
2. **Reminder Scheduler**: Schedules and sends email reminders for upcoming contests
3. **Authentication System**: Handles user registration, login, and access control
4. **API Layer**: RESTful endpoints for frontend-backend communication
5. **Frontend Application**: User interface for interacting with the system

## 3. Backend Implementation

### Database Schema

The application uses MongoDB with four main collections:

#### User Model

```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  date: { type: Date, default: Date.now },
});
```

#### Contest Model

```javascript
const ContestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  platform: {
    type: String,
    required: true,
    enum: ["Codeforces", "CodeChef", "Leetcode"],
    index: true,
  },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true, index: true },
  url: { type: String, required: true },
  status: {
    type: String,
    enum: ["upcoming", "ongoing", "past"],
    required: true,
    index: true,
  },
  duration: { type: Number, required: true },
  solutionUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isTest: { type: Boolean, default: false, index: true },
});
```

The Contest model includes virtual properties and methods for time remaining calculations and status checks.

#### Bookmark Model

```javascript
const BookmarkSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contest",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});
```

With a compound index on `userId` and `contestId` to ensure uniqueness.

#### Reminder Model

```javascript
const ReminderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contest",
    required: true,
  },
  reminderTime: {
    type: String,
    enum: ["30min", "1hour"],
    required: true,
  },
  sent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
```

With a compound index to ensure one reminder per user per contest.

### Contest Fetching Service

The `contestFetcher.js` implements a robust service that:

1. Fetches contests from three platforms:

   - Codeforces (API with fallback to web scraping)
   - CodeChef (API)
   - LeetCode (GraphQL API with fallback to web scraping)

2. Implements intelligent error handling with fallback mechanisms:

   ```javascript
   async function fetchWithRetry(url, options = {}, retries = 3, delay = 2000) {
     try {
       await new Promise((r) => setTimeout(r, getRandomDelay()));
       return await axios(url, options);
     } catch (error) {
       if (retries <= 1) throw error;
       console.log(
         `Request to ${url} failed, retrying... (${retries - 1} attempts left)`
       );
       await new Promise((r) => setTimeout(r, delay));
       return fetchWithRetry(url, options, retries - 1, delay * 1.5);
     }
   }
   ```

3. Uses randomized delays between requests to avoid rate limiting:

   ```javascript
   function getRandomDelay(min = 1000, max = 3000) {
     return Math.floor(Math.random() * (max - min + 1)) + min;
   }
   ```

4. Implements browser-like request headers to avoid bot detection:

   ```javascript
   const getBrowserHeaders = (referer = "") => ({
     "User-Agent":
       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
     // Other headers...
   });
   ```

5. Updates contest statuses automatically based on start and end times:

   ```javascript
   async function updateContestStatus() {
     const now = new Date();
     // Update contests from upcoming to ongoing when start time passed
     const upcomingToOngoing = await Contest.updateMany(
       { status: "upcoming", startTime: { $lte: now } },
       { $set: { status: "ongoing" } }
     );
     // Update contests from ongoing to past when end time passed
     const ongoingToPast = await Contest.updateMany(
       { status: "ongoing", endTime: { $lte: now } },
       { $set: { status: "past" } }
     );
     // Return statistics
   }
   ```

6. Logs raw HTML and API responses for debugging:

   ```javascript
   const logHtml = (html, platform) => {
     // Save HTML response to log file
   };

   const logObject = (obj, name) => {
     // Save object to JSON log file
   };
   ```

7. Runs on a schedule using node-cron:
   ```javascript
   cron.schedule("0 */4 * * *", async () => {
     // Run every 4 hours
     console.log("Running scheduled contest update...");
     try {
       const contests = await fetchAllContests();
       console.log(
         `Scheduled update complete. Fetched ${contests.length} contests.`
       );
     } catch (error) {
       console.error("Error during scheduled contest update:", error.message);
     }
   });
   ```

### Authentication & Authorization

The system implements JWT-based authentication:

1. **JWT Creation**:

   ```javascript
   jwt.sign(
     payload,
     config.get("jwtSecret"),
     { expiresIn: "5 days" },
     (err, token) => {
       if (err) throw err;
       res.json({ token });
     }
   );
   ```

2. **Authentication Middleware**:

   ```javascript
   module.exports = function (req, res, next) {
     const token = req.header("x-auth-token");
     if (!token) {
       return res.status(401).json({ msg: "No token, authorization denied" });
     }
     try {
       const decoded = jwt.verify(token, config.get("jwtSecret"));
       req.user = decoded.user;
       next();
     } catch (err) {
       res.status(401).json({ msg: "Token is not valid" });
     }
   };
   ```

3. **Role-Based Authorization**:

   ```javascript
   // Admin middleware
   module.exports = function (req, res, next) {
     if (req.user && req.user.role === "admin") {
       next();
     } else {
       res
         .status(403)
         .json({ msg: "Access denied. Admin privileges required." });
     }
   };
   ```

4. **Password Hashing**:

   ```javascript
   const salt = await bcrypt.genSalt(10);
   user.password = await bcrypt.hash(password, salt);
   ```

5. **Security Headers**:
   Headers for API routes are carefully set to prevent common web vulnerabilities.

### Email Service

The system implements an email service for contest reminders:

1. **Email Transport Setup**:

   ```javascript
   const createTransporter = () => {
     try {
       return nodemailer.createTransport({
         service: config.get("emailService"),
         auth: {
           user: config.get("emailUser"),
           pass: config.get("emailPassword"),
         },
       });
     } catch (error) {
       console.error("Error creating email transporter:", error);
       return null;
     }
   };
   ```

2. **Email Template with HTML**:

   ```javascript
   const mailOptions = {
     from: config.get("emailUser"),
     to: userEmail,
     subject: `🔔 Reminder: ${contestName} starts in ${timeMessage}`,
     html: `
       <div style="font-family: Arial, sans-serif; max-width: 600px;">
         <!-- Email template HTML -->
       </div>
     `,
   };
   ```

3. **Email Sending Logic**:
   ```javascript
   const info = await transporter.sendMail(mailOptions);
   console.log(`Email sent: ${info.response}`);
   return true;
   ```

### Reminder Scheduler

The reminder system checks for upcoming contests and sends emails at appropriate times:

```javascript
cron.schedule("* * * * *", async () => {
  // Run every minute
  try {
    const now = new Date();
    // Find all upcoming contests
    const upcomingContests = await Contest.find({
      status: "upcoming",
      startTime: { $gt: now },
    });

    for (const contest of upcomingContests) {
      const contestStartTime = new Date(contest.startTime);
      // Calculate time difference in minutes
      const timeDiffMinutes = Math.round(
        (contestStartTime - now) / (60 * 1000)
      );

      // Check for 30-minute reminders (between 29 and 31 minutes before)
      if (timeDiffMinutes >= 29 && timeDiffMinutes <= 31) {
        console.log(`Contest ${contest.name} starts in ~30 minutes`);
        await sendReminders(contest, "30min");
      }

      // Check for 1-hour reminders (between 59 and 61 minutes before)
      if (timeDiffMinutes >= 59 && timeDiffMinutes <= 61) {
        console.log(`Contest ${contest.name} starts in ~1 hour`);
        await sendReminders(contest, "1hour");
      }
    }
  } catch (error) {
    console.error("Error in reminder scheduler:", error);
  }
});
```

### API Endpoints

The application implements a comprehensive set of RESTful API endpoints:

#### Auth Routes

- `POST /api/auth/login` - User login
- `GET /api/auth` - Get authenticated user data

#### User Routes

- `POST /api/users` - Register a user
- `POST /api/users/admin` - Create an admin user (admin only)
- `DELETE /api/users` - Delete own account

#### Contest Routes

- `GET /api/contests` - Get all contests with filtering
- `GET /api/contests/upcoming` - Get upcoming contests
- `GET /api/contests/ongoing` - Get ongoing contests
- `GET /api/contests/past` - Get past contests
- `GET /api/contests/:id` - Get a single contest
- `POST /api/contests/update` - Manually trigger contest update
- `POST /api/contests/:id/solution` - Add solution URL (admin only)

#### Bookmark Routes

- `GET /api/bookmarks/:userId` - Get user's bookmarks
- `POST /api/bookmarks` - Add a bookmark
- `POST /api/bookmarks/toggle` - Toggle bookmark status
- `DELETE /api/bookmarks/:bookmarkId` - Delete a bookmark

#### Reminder Routes

- `GET /api/reminders/:userId` - Get user's reminders
- `POST /api/reminders` - Set a reminder
- `DELETE /api/reminders/:reminderId` - Delete a reminder

#### Admin Routes

- `GET /api/admin/users` - Get all users (admin only)
- `DELETE /api/admin/users/:id` - Delete a user (admin only)

### Security Features

1. **Rate Limiting**:

   ```javascript
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   });

   router.get("/", limiter, auth, async (req, res) => {
     // Route handler
   });
   ```

2. **Input Validation**:

   ```javascript
   router.post(
     "/",
     limiter,
     [
       check("name", "Name is required").not().isEmpty(),
       check("email", "Please include a valid email").isEmail(),
       check(
         "password",
         "Please enter a password with 6 or more characters"
       ).isLength({ min: 6 }),
     ],
     async (req, res) => {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
       }
       // Route handler
     }
   );
   ```

3. **MongoDB Query Security**:

   ```javascript
   // Using $eq operator to prevent NoSQL injection
   let user = await User.findOne({ email: { $eq: email } });
   ```

4. **Secure Error Handling**:
   Errors are logged but not exposed to clients in ways that could reveal system details.

## 4. Frontend Implementation

### State Management with Redux

The application uses Redux with Redux Toolkit for state management:

1. **Store Configuration**:

   ```javascript
   const store = configureStore({
     reducer: {
       contests: contestsReducer,
       bookmarks: bookmarksReducer,
       auth: persistedAuthReducer,
       reminders: remindersReducer,
     },
     middleware: (getDefaultMiddleware) =>
       getDefaultMiddleware({
         serializableCheck: false,
       }),
   });
   ```

2. **Redux Persistence**:

   ```javascript
   const authPersistConfig = {
     key: "auth",
     storage,
     whitelist: ["token", "isAuthenticated", "user"],
   };
   const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
   ```

3. **Async Thunks**:
   ```javascript
   export const fetchBookmarks = createAsyncThunk(
     "bookmarks/fetchAll",
     async (_, { rejectWithValue, getState }) => {
       try {
         const userId = getState().auth.user?._id;
         if (!userId) {
           console.log("No user ID found, skipping bookmark fetch");
           return [];
         }
         const response = await axios.get(`${API_URL}/bookmarks/${userId}`);
         return response.data;
       } catch (error) {
         return rejectWithValue(error.response?.data?.message || error.message);
       }
     }
   );
   ```

### Component Structure

The frontend is organized into several key components:

1. **Layout Components**:

   - `Navbar.jsx` - Navigation bar with user-specific links
   - `ThemeToggle.jsx` - Dark/light mode toggle

2. **Authentication Components**:

   - `Login.jsx` - User login form
   - `Register.jsx` - User registration form
   - `PrivateRoute.jsx` - Route protection for authenticated users
   - `AdminRoute.jsx` - Route protection for admin users

3. **Contest Components**:

   - `ContestList.jsx` - Main contest listing with filter tabs
   - `ContestItem.jsx` - Card view for individual contest
   - `ContestTableView.jsx` - Table view for contests
   - `FilterPanel.jsx` - Platform filtering options

4. **User Features**:

   - `Bookmarks.jsx` - User's bookmarked contests
   - `AccountSettings.jsx` - User account management

5. **Admin Components**:
   - `AdminPanel.jsx` - Admin dashboard
   - `SolutionUrlForm.jsx` - Add solution links to past contests
   - `UserManagement.jsx` - User administration

### User Interface Features

1. **Theme Context**:

   ```javascript
   const ThemeProvider = ({ children }) => {
     const savedTheme = localStorage.getItem("theme");
     const [theme, setTheme] = useState(savedTheme || "light");

     useEffect(() => {
       localStorage.setItem("theme", theme);
       document.documentElement.setAttribute("data-theme", theme);
     }, [theme]);

     const toggleTheme = () => {
       setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
     };

     return (
       <ThemeContext.Provider value={{ theme, toggleTheme }}>
         {children}
       </ThemeContext.Provider>
     );
   };
   ```

2. **View Toggling**:

   ```javascript
   function ViewToggle({ currentView, onViewChange }) {
     const toggleView = () => {
       const newView = currentView === "card" ? "table" : "card";
       onViewChange(newView);
     };

     return (
       <div className="view-toggle-single">
         <button
           className="view-toggle-btn"
           onClick={toggleView}
           title={
             currentView === "card"
               ? "Switch to Table View"
               : "Switch to Card View"
           }
         >
           <i
             className={`fas ${
               currentView === "card" ? "fa-table" : "fa-th-large"
             }`}
           ></i>
         </button>
       </div>
     );
   }
   ```

3. **Contest Filtering**:

   ```javascript
   function FilterPanel({ filters, onFilterChange }) {
     const [isOpen, setIsOpen] = useState(false);
     const platforms = ["Codeforces", "CodeChef", "Leetcode"];

     const togglePlatform = (platform) => {
       // Filter logic implementation
     };

     return (
       <div className="filter-panel">{/* Filter UI implementation */}</div>
     );
   }
   ```

## 5. Deployment & Configuration

### Configuration Management

The application uses Node.js `config` module for managing environment-specific configurations:

```javascript
// default.json
{
  "mongoURI": "mongodb+srv://...",
  "jwtSecret": "e369f027d52abd90ec...",
  "emailService": "gmail",
  "emailUser": "example@gmail.com",
  "emailPassword": "app-password-here"
}
```

### API Configuration

API URLs are determined based on the environment:

```javascript
const getApiUrl = () => {
  // In production, use relative URL
  if (import.meta.env.NODE_ENV === "production" || import.meta.env.PROD) {
    return "/api";
  }
  // In development, use localhost with port from env variable or default
  const devPort = import.meta.env.REACT_APP_API_PORT || 5000;
  return `http://localhost:${devPort}/api`;
};
```

### Database Connection

MongoDB connection with proper error handling:

```javascript
const connectDB = async () => {
  try {
    let mongoURI;
    try {
      mongoURI = config.get("mongoURI");
    } catch (err) {
      mongoURI = process.env.MONGO_URI;
    }

    if (!mongoURI) {
      console.error("FATAL ERROR: MongoDB URI is not defined.");
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Error event listeners
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected, attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed due to app termination");
      process.exit(0);
    });

    return conn;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    // Specific error messages for common connection issues
    process.exit(1);
  }
};
```

## 6. Key Technical Features

1. **Platform-Specific Contest Fetching**:
   Each platform has custom fetching logic with fallbacks:

   - Codeforces: Primary API with web scraping fallback
   - CodeChef: API integration
   - LeetCode: GraphQL API with web scraping fallback

2. **Contest Status Tracking**:
   Automatic status updates based on contest times:

   ```javascript
   ContestSchema.pre("save", function (next) {
     const now = new Date();
     if (this.startTime > now) {
       this.status = "upcoming";
     } else if (this.endTime > now) {
       this.status = "ongoing";
     } else {
       this.status = "past";
     }
     next();
   });
   ```

3. **Reminder System**:
   Two-stage reminder system with 30-minute and 1-hour notifications.

4. **Responsive Design**:
   Card and table views with mobile-friendly layout.

5. **Sorting and Filtering**:
   Advanced contest filtering and sorting options:
   ```javascript
   const sortedContests = useMemo(() => {
     let sortableContests = [...contests];
     if (sortConfig.key) {
       sortableContests.sort((a, b) => {
         // Custom sorting logic based on different fields
       });
     }
     return sortableContests;
   }, [contests, sortConfig]);
   ```
