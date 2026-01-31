export default function TimePicker({ value = "09:00", onChange }) {
  const [hour, minute] = value.split(':');

  const handleHourChange = (e) => {
    const newHour = e.target.value;
    onChange(`${newHour}:${minute}`);
  };

  const handleMinuteChange = (e) => {
    const newMinute = e.target.value;
    onChange(`${hour}:${newMinute}`);
  };

  // Generate hour options (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  // Generate minute options (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="flex items-center gap-2">
      <select
        value={hour}
        onChange={handleHourChange}
        className="px-3 py-2 bg-gray-900/50 border-2 border-purple-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-center cursor-pointer hover:bg-gray-900/70 transition-all"
      >
        {hours.map(h => (
          <option key={h} value={h} className="bg-gray-900 text-white">
            {h}
          </option>
        ))}
      </select>
      <span className="text-white font-bold text-lg">:</span>
      <select
        value={minute}
        onChange={handleMinuteChange}
        className="px-3 py-2 bg-gray-900/50 border-2 border-purple-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-center cursor-pointer hover:bg-gray-900/70 transition-all"
      >
        {minutes.map(m => (
          <option key={m} value={m} className="bg-gray-900 text-white">
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
