import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./authSlice";
import bookmarksReducer from "./bookmarksSlice";
import contestsReducer from "./contestsSlice";
import remindersReducer from "./remindersSlice";
// Include user in the whitelist to persist user data across page refreshes
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "isAuthenticated", "user"],
};
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
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
export const persistor = persistStore(store);
export default store;
