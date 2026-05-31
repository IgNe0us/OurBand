"use client";
import React, { createContext, useContext, useState } from "react";
import { UserProfileModal } from "@/components/common/UserProfileModal";

interface UserProfileContextType {
  openUserProfile: (userId: number, userName?: string, userImage?: string) => void;
  closeUserProfile: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; name?: string; image?: string } | null>(null);

  const openUserProfile = (userId: number, userName?: string, userImage?: string) => {
    setSelectedUser({ id: userId, name: userName, image: userImage });
    setIsOpen(true);
  };

  const closeUserProfile = () => {
    setIsOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  return (
    <UserProfileContext.Provider value={{ openUserProfile, closeUserProfile }}>
      {children}
      {selectedUser && (
        <UserProfileModal
          isOpen={isOpen}
          onClose={closeUserProfile}
          userId={selectedUser.id}
          userName={selectedUser.name}
          userImage={selectedUser.image}
        />
      )}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) throw new Error("useUserProfile must be used within a UserProfileProvider");
  return context;
};
