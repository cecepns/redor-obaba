import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      default:
        return <CheckCircle2 className="w-6 h-6 text-blue-600" />;
    }
  };

  const getConfirmButtonClasses = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" showCloseButton={false}>
      <div className="flex flex-col items-center text-center">
        <div className={`p-3 rounded-full mb-4 ${
          type === 'danger' ? 'bg-red-100' : type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
        }`}>
          {getIcon()}
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end space-x-3 w-full">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`w-1/2 py-2.5 px-4 rounded-xl font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center space-x-2 ${getConfirmButtonClasses()}`}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
