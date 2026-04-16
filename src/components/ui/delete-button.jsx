import { useState } from 'react'
import { Trash2, X, Check } from 'lucide-react'

/**
 * NativeDelete - A confirmation delete button component
 * Shows a delete button that expands to show confirmation UI
 */
export function NativeDelete({ onConfirm, onDelete, className = '' }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDeleteClick = () => {
    setShowConfirm(true)
    if (onConfirm) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  const handleConfirmDelete = () => {
    setShowConfirm(false)
    if (onDelete) {
      onDelete()
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {!showConfirm ? (
        <button
          onClick={handleDeleteClick}
          className="p-1.5 text-white bg-red-500 border border-red-500 rounded-lg hover:bg-red-600 transition-all"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      ) : (
        <>
          <button
            onClick={handleConfirmDelete}
            className="p-1.5 text-white bg-red-500 border border-red-500 rounded-lg hover:bg-red-600 transition-all"
            title="Yes"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all"
            title="No"
          >
            <X className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  )
}

/**
 * DeleteButton - A simpler delete button with native browser confirm dialog
 */
export function DeleteButton({ onDelete, confirmMessage = 'Are you sure you want to delete this?', className = '' }) {
  const handleDelete = () => {
    if (window.confirm(confirmMessage)) {
      onDelete()
    }
  }

  return (
    <button
      onClick={handleDelete}
      className={`px-3 py-1.5 text-xs border border-red-600 text-red-300 rounded-lg hover:bg-red-900/50 transition-all ${className}`}
      title="Delete"
    >
      <Trash2 className="w-3 h-3" />
    </button>
  )
}
