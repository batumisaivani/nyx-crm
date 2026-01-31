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

  if (!showConfirm) {
    return (
      <button
        onClick={handleDeleteClick}
        className={`px-3 py-1.5 text-xs border border-red-600 text-red-300 rounded-lg hover:bg-red-900/50 transition-all flex items-center gap-1 font-medium ${className}`}
        title="Delete"
      >
        <Trash2 className="w-3 h-3" />
        <span>Delete</span>
      </button>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-xs text-red-300 font-medium whitespace-nowrap">Delete?</span>
      <button
        onClick={handleConfirmDelete}
        className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center space-x-1"
        title="Confirm Delete"
      >
        <Check className="w-3 h-3" />
        <span>Yes</span>
      </button>
      <button
        onClick={handleCancel}
        className="px-2 py-1 text-xs border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-all flex items-center space-x-1"
        title="Cancel"
      >
        <X className="w-3 h-3" />
        <span>No</span>
      </button>
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
