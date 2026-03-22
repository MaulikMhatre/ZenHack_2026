"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: any, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: any, type: ToastType = 'info') => {
    let safeMessage = message;

    // Safety check for objects/arrays being passed as message
    if (typeof message !== 'string') {
      if (Array.isArray(message)) {
        // Handle lists (often Pydantic errors)
        safeMessage = message.map(item =>
          typeof item === 'object' ? (item.msg || item.message || JSON.stringify(item)) : String(item)
        ).join(', ');
      } else if (typeof message === 'object' && message !== null) {
        // Handle Pydantic error objects or other objects
        safeMessage = message.msg || message.message || message.detail || JSON.stringify(message);

        // If the extracted value is still an object/array, stringify it
        if (typeof safeMessage !== 'string') {
          safeMessage = JSON.stringify(safeMessage);
        }
      } else {
        safeMessage = String(message);
      }
    }

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message: safeMessage, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`
                min-w-[300px] p-4 rounded-xl shadow-2xl backdrop-blur-md border border-white/10
                flex items-center gap-3 cursor-pointer relative overflow-hidden
                ${t.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                ${t.type === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : ''}
                ${t.type === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                ${t.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
              `}
              onClick={() => removeToast(t.id)}
            >
              <div className={`
                p-2 rounded-full 
                ${t.type === 'success' ? 'bg-emerald-500/20' : ''}
                ${t.type === 'error' ? 'bg-rose-500/20' : ''}
                ${t.type === 'info' ? 'bg-blue-500/20' : ''}
                ${t.type === 'warning' ? 'bg-amber-500/20' : ''}
              `}>
                {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {t.type === 'info' && <Info className="w-5 h-5" />}
                {t.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              </div>

              <p className="text-sm font-medium pr-6">{t.message}</p>

              <button
                onClick={(e) => { e.stopPropagation(); removeToast(t.id); }}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-3 h-3 opacity-50" />
              </button>

              {/* Progress Bar Animation */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-0.5 
                  ${t.type === 'success' ? 'bg-emerald-500/50' : ''}
                  ${t.type === 'error' ? 'bg-rose-500/50' : ''}
                  ${t.type === 'info' ? 'bg-blue-500/50' : ''}
                  ${t.type === 'warning' ? 'bg-amber-500/50' : ''}
                `}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
