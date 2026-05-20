import React from 'react';
import { AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isConfirming?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  children?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isConfirming = false,
  size = 'sm',
  children,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-500 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
        );
      case 'success':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        );
      case 'info':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800 text-blue-500 flex items-center justify-center">
            <Info size={20} />
          </div>
        );
      case 'warning':
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 text-amber-500 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white';
      case 'success':
        return 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white';
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white';
      case 'warning':
      default:
        return 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white';
    }
  };

  const footer = (
    <>
      <button
        onClick={onClose}
        disabled={isConfirming}
        className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[13px] font-bold text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50"
      >
        {cancelText}
      </button>
      <button
        onClick={() => {
          void onConfirm();
        }}
        disabled={isConfirming}
        className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 ${getConfirmButtonClasses()}`}
      >
        {isConfirming && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          {getIcon()}
          <span>{title}</span>
        </div>
      }
      size={size}
      footer={footer}
    >
      <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
        {message}
      </p>
      {children}
    </Modal>
  );
};

export default ConfirmationModal;
