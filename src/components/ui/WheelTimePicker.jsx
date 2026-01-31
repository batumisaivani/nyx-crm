import { useState, useRef, useEffect, useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export default function WheelTimePicker({ isOpen, onClose, value = "09:00", onConfirm, buttonRef }) {
  const [hour, minute] = value.split(':');
  const [selectedHour, setSelectedHour] = useState(hour);
  const [selectedMinute, setSelectedMinute] = useState(minute);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const pickerRef = useRef(null);
  const hasInitializedScroll = useRef(false);
  const isUserScrolling = useRef(false);

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;

      setPosition({
        top: buttonRect.top + scrollY - 220, // Position above button
        left: buttonRect.left + scrollX + (buttonRect.width / 2) - 100 // Center horizontally
      });

      const [h, m] = value.split(':');
      setSelectedHour(h);
      setSelectedMinute(m);

      // Only initialize scroll position once when modal first opens
      if (!hasInitializedScroll.current) {
        // Scroll to selected values after a brief delay to ensure DOM is ready
        const scrollTimer = setTimeout(() => {
          if (hourRef.current && hourRef.current.scrollHeight > hourRef.current.clientHeight) {
            const hourIndex = hours.indexOf(h);
            const scrollPosition = hourIndex * 36;
            hourRef.current.scrollTop = scrollPosition;
          }
          if (minuteRef.current && minuteRef.current.scrollHeight > minuteRef.current.clientHeight) {
            const minuteIndex = minutes.indexOf(m);
            const scrollPosition = minuteIndex * 36;
            minuteRef.current.scrollTop = scrollPosition;
          }
          hasInitializedScroll.current = true;
        }, 150);

        return () => clearTimeout(scrollTimer);
      }
    } else if (!isOpen) {
      // Reset when closed
      hasInitializedScroll.current = false;
      isUserScrolling.current = false;
    }
  }, [isOpen, value, buttonRef]);

  const handleConfirm = () => {
    onConfirm(`${selectedHour}:${selectedMinute}`);
    onClose();
  };

  const WheelColumn = ({ items, selected, scrollRef, setter }) => {
    const scrollTimeout = useRef(null);

    const onScroll = () => {
      if (!scrollRef.current) return;

      // Mark that user is actively scrolling
      isUserScrolling.current = true;

      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Set timeout to snap after scrolling stops
      scrollTimeout.current = setTimeout(() => {
        if (!scrollRef.current) return;

        const currentScrollTop = scrollRef.current.scrollTop;
        const finalIndex = Math.round(currentScrollTop / 36);
        const finalClampedIndex = Math.max(0, Math.min(finalIndex, items.length - 1));

        // Just update the state - browser's scroll-snap handles positioning
        setter(items[finalClampedIndex]);

        // Mark that scrolling is complete
        isUserScrolling.current = false;
      }, 150);
    };

    return (
      <div className="relative h-[144px] w-14 overflow-hidden rounded-lg">
        {/* Top gradient fade */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-900 via-gray-900/80 to-transparent z-10 pointer-events-none" />

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-10 pointer-events-none" />

        {/* Selection highlight */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-9 bg-purple-600/20 border-y border-purple-500/50 pointer-events-none z-[5]" />

        {/* Scrollable numbers */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto scrollbar-hide cursor-grab active:cursor-grabbing"
          style={{
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Top padding */}
          <div className="h-[54px] flex-shrink-0" />

          {items.map((item, index) => (
            <div
              key={item}
              className="h-9 flex items-center justify-center snap-center flex-shrink-0"
              style={{ scrollSnapAlign: 'center' }}
              onClick={() => {
                scrollRef.current.scrollTo({
                  top: index * 36,
                  behavior: 'smooth'
                });
              }}
            >
              <span
                className={`text-xl font-bold transition-all duration-150 select-none ${
                  selected === item
                    ? 'text-white scale-110'
                    : 'text-gray-500 scale-90 opacity-60'
                }`}
              >
                {item}
              </span>
            </div>
          ))}

          {/* Bottom padding */}
          <div className="h-[54px] flex-shrink-0" />
        </div>
      </div>
    );
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
            onClick={onClose}
            className="fixed inset-0 z-[60]"
          />

          {/* Popover */}
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
              position: 'absolute',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 70
            }}
            className="bg-gray-900/98 backdrop-blur-xl rounded-xl border-2 border-purple-600 shadow-2xl shadow-purple-500/30 p-3 w-[200px]"
          >
            {/* Time Wheels */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <WheelColumn
                items={hours}
                selected={selectedHour}
                scrollRef={hourRef}
                setter={setSelectedHour}
              />
              <span className="text-2xl text-purple-400 font-bold">:</span>
              <WheelColumn
                items={minutes}
                selected={selectedMinute}
                scrollRef={minuteRef}
                setter={setSelectedMinute}
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-2 py-1.5 bg-gray-800/50 border border-gray-700 text-gray-300 rounded hover:bg-gray-800/70 transition-all text-xs font-medium"
              >
                <X className="w-3 h-3 mx-auto" />
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-2 py-1.5 bg-purple-600/30 border border-purple-500 text-white rounded hover:bg-purple-600/40 transition-all text-xs font-medium"
              >
                <Check className="w-3 h-3 mx-auto" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
