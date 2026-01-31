import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TimePicker from './TimePicker';

export default function TimePickerModal({ isOpen, onClose, openTime, closeTime, onConfirm, title = "Working Hours" }) {
  const [tempOpenTime, setTempOpenTime] = useState(openTime);
  const [tempCloseTime, setTempCloseTime] = useState(closeTime);

  useEffect(() => {
    if (isOpen) {
      setTempOpenTime(openTime);
      setTempCloseTime(closeTime);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm({ openTime: tempOpenTime, closeTime: tempCloseTime });
  };

  const handleCancel = () => {
    setTempOpenTime(openTime);
    setTempCloseTime(closeTime);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border-2 border-purple-600 shadow-2xl shadow-purple-500/20 p-6 min-w-[320px] pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-purple-900/30 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Time Pickers */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <label className="text-xs text-gray-400 mb-2 font-medium">Opening Time</label>
                  <TimePicker
                    value={tempOpenTime}
                    onChange={setTempOpenTime}
                  />
                </div>
                <span className="text-gray-300 font-medium mt-6">to</span>
                <div className="flex flex-col items-center">
                  <label className="text-xs text-gray-400 mb-2 font-medium">Closing Time</label>
                  <TimePicker
                    value={tempCloseTime}
                    onChange={setTempCloseTime}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 bg-gray-800/50 border-2 border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800/70 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2.5 bg-purple-900/30 border-2 border-purple-600 text-white rounded-lg hover:bg-purple-900/40 transition-all font-medium"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
