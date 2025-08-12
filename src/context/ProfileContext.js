// FILE: src/context/ProfileContext.js
import React, { createContext, useContext } from "react";

const ProfileCtx = createContext({});

export function ProfileProvider({ children }) {
  // Placeholder for future profile preferences
  const value = {};
  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>;
}

export function useProfile() {
  return useContext(ProfileCtx);
}
