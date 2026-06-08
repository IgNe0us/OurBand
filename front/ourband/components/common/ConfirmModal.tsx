import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  hideCancel?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  isDestructive = false,
  hideCancel = false
}: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Decorative background glow */}
          <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${isDestructive ? 'bg-red-500' : 'bg-primary'}`} />
          
          <div className="flex flex-col items-center text-center relative z-10">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
              <AlertCircle size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-300 mb-6">{message}</p>
            
            <div className="flex gap-3 w-full">
              {!hideCancel && (
                <button 
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  {cancelText}
                </button>
              )}
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isDestructive 
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                  : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 hover:shadow-primary/40'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
