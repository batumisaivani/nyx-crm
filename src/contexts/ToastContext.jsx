import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const toast = {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    warning: (message) => addToast(message, 'warning'),
    info: (message) => addToast(message, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ id, message, type, onClose }) {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-gradient-to-r from-green-900/90 to-emerald-900/90',
      borderColor: 'border-green-500',
      iconColor: 'text-green-400',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-gradient-to-r from-red-900/90 to-rose-900/90',
      borderColor: 'border-red-500',
      iconColor: 'text-red-400',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-gradient-to-r from-yellow-900/90 to-amber-900/90',
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-400',
    },
    info: {
      icon: Info,
      bgColor: 'bg-gradient-to-r from-purple-900/90 to-violet-900/90',
      borderColor: 'border-purple-500',
      iconColor: 'text-purple-400',
    },
  }

  const { icon: Icon, bgColor, borderColor, iconColor } = config[type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className={`${bgColor} ${borderColor} backdrop-blur-xl border-2 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[400px] pointer-events-auto`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} />
        <p className="text-white text-sm font-medium flex-1 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}
