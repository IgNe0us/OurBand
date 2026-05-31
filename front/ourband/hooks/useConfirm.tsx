"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ConfirmModal } from '@/components/common/ConfirmModal';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);
  
  const [modalConfig, setModalConfig] = useState<ConfirmOptions>({
    title: "확인",
    message: "",
    confirmText: "확인",
    cancelText: "취소",
    isDestructive: false
  });

  const confirm = (options: ConfirmOptions) => {
    setModalConfig({
      title: options.title || "확인",
      message: options.message,
      confirmText: options.confirmText || "확인",
      cancelText: options.cancelText || "취소",
      isDestructive: options.isDestructive || false
    });
    setIsOpen(true);
    
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) resolvePromise(true);
    setIsOpen(false);
  };

  const handleClose = () => {
    if (resolvePromise) resolvePromise(false);
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal 
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalConfig.title || "확인"}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        isDestructive={modalConfig.isDestructive}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
