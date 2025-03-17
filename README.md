# Contest Tracker

Develop a Contest Tracker using the **MERN stack** to fetch and display upcoming and past coding contests from **Codeforces, CodeChef, and Leetcode**. The application will allow users to filter contests by platform, bookmark contests, and link solutions from a YouTube channel.

## Core Features

### 1. Fetch and Display Contests

- Retrieve upcoming contests from **Codeforces, CodeChef, and Leetcode**.
- Display contest details:
  - **Name**
  - **Platform**
  - **Date & Time**
  - **Time remaining before start**
- Show past contests from the **last 1 week**.

### 2. Filtering Options

- Allow users to **filter** contests by one or more platforms:
  - Codeforces
  - CodeChef
  - Leetcode

### 3. Bookmarking Contests

- Users can **bookmark** contests for easy access later.

### 4. Contest Solutions Integration

- Provide a form where team members can manually **attach YouTube solution links** for past contests.
- **Form accessible via a separate URL**.
- Playlists for solutions:
  - **Leetcode PCDs**
  - **Codeforces PCDs**
  - **CodeChef PCDs**
- **Bonus:** Automatically fetch solution links from YouTube when uploaded.

---

## Bonus Features

### 5. Contest Reminders

- Users can **sign up for contest reminders**.
- Choose **platform(s)** for notifications.
- Choose **reminder type**:
  - **Email**
  - **SMS**
- Choose **reminder time**:
  - **1 hour before**
  - **30 minutes before**

### 6. Code Quality & Documentation

- **Code is well-documented**.
- **Basic documentation** provided for setup and usage.

# 📂 Structure

- 📄 `.gitignore`
- 📄 `structure.txt`
- 📁 **client**
  - 📄 `index.html`
  - 📄 `eslint.config.js`
  - 📄 `vite.config.js`
  - 📄 `package-lock.json`
  - 📄 `package.json`
  - 📁 **public**
  - 📁 **src**
    - 📄 `App.css`
    - 📄 `index.css`
    - 📄 `App.jsx`
    - 📄 `main.jsx`
    - 📁 **assets**
    - 📁 **components**
      - 📄 `AccountSettings.jsx`
      - 📄 `Bookmarks.jsx`
      - 📄 `ContestItem.jsx`
      - 📄 `ContestList.jsx`
      - 📄 `FilterPanel.jsx`
      - 📄 `Navbar.jsx`
      - 📄 `SolutionUrlForm.jsx`
      - 📄 `ThemeToggle.jsx`
      - 📁 **admin**
        - 📄 `UserManagement.jsx`
      - 📁 **auth**
        - 📄 `AdminPanel.jsx`
        - 📄 `Login.jsx`
        - 📄 `Register.jsx`
      - 📁 **routing**
        - 📄 `AdminRoute.jsx`
        - 📄 `PrivateRoute.jsx`
    - 📁 **context**
      - 📄 `ThemeContext.js`
      - 📄 `ThemeProvider.jsx`
    - 📁 **redux**
      - 📄 `authSlice.js`
      - 📄 `bookmarksSlice.js`
      - 📄 `contestsSlice.js`
      - 📄 `remindersSlice.js`
      - 📄 `store.js`
      - 📄 `types.js`
    - 📁 **styles**
      - 📄 `AccountSettings.css`
      - 📄 `Auth.css`
      - 📄 `main.css`
      - 📄 `SolutionForm.css`
      - 📄 `UserManagement.css`
    - 📁 **utils**
      - 📄 `setAuthToken.js`
- 📁 **server**
  - 📄 `generate-password.js`
  - 📄 `server.js`
  - 📄 `package-lock.json`
  - 📄 `package.json`
  - 📁 **config**
    - 📄 `db.js`
    - 📄 `default.json`
  - 📁 **middleware**
    - 📄 `admin.js`
    - 📄 `auth.js`
  - 📁 **models**
    - 📄 `Bookmark.js`
    - 📄 `Contest.js`
    - 📄 `Reminder.js`
    - 📄 `User.js`
  - 📁 **routes**
    - 📄 `admin.js`
    - 📄 `bookmarks.js`
    - 📄 `contests.js`
    - 📄 `reminders.js`
    - 📁 **api**
      - 📄 `auth.js`
      - 📄 `users.js`
  - 📁 **scripts**
    - 📄 `list-users.js`
    - 📄 `test-reminder.js`
  - 📁 **services**
    - 📄 `codechefClipboardParser.js`
    - 📄 `codechefPuppeteer.js`
    - 📄 `contestFetcher.js`
    - 📄 `emailService.js`
    - 📄 `reminderScheduler.js`
