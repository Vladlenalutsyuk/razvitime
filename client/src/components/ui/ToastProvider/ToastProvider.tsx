import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ToastType = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  message: string
  type: ToastType
}

type ShowToastOptions = {
  type?: ToastType
  duration?: number
}

type ToastContextValue = {
  showToast: (message: string, options?: ShowToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

type ToastProviderProps = {
  children: ReactNode
}

function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, options?: ShowToastOptions) => {
      const id = Date.now() + Math.floor(Math.random() * 10000)
      const type = options?.type || 'info'
      const duration = options?.duration ?? 3000

      const toast: ToastItem = {
        id,
        message,
        type,
      }

      setToasts((prev) => [...prev, toast])

      window.setTimeout(() => {
        removeToast(id)
      }, duration)
    },
    [removeToast]
  )

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            role="status"
            aria-live="polite"
          >
            <div className="toast__content">
              <span className="toast__message">{toast.message}</span>

              <button
                type="button"
                className="toast__close"
                onClick={() => removeToast(toast.id)}
                aria-label="Закрыть уведомление"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }

  return context
}

export default ToastProvider