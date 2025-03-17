import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import contestsReducer from "./contestsSlice";
import bookmarksReducer from "./bookmarksSlice";
import authReducer from "./authSlice";
import remindersReducer from "./remindersSlice";
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "isAuthenticated"],
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
