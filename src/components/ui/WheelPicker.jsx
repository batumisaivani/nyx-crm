import "@ncdai/react-wheel-picker/style.css";
import * as WheelPickerPrimitive from "@ncdai/react-wheel-picker";
import { cn } from "../../lib/utils";

function WheelPickerWrapper({ className, ...props }) {
  return (
    <WheelPickerPrimitive.WheelPickerWrapper
      className={cn(
        "w-full rounded-lg border-2 border-purple-600 bg-gray-900/50 px-1",
        "*:data-rwp:first:*:data-rwp-highlight-wrapper:rounded-s-md",
        "*:data-rwp:last:*:data-rwp-highlight-wrapper:rounded-e-md",
        className
      )}
      {...props}
    />
  );
}

function WheelPicker({ classNames, onChange, ...props }) {
  console.log('WheelPicker wrapper - onChange prop:', typeof onChange, onChange ? 'provided' : 'missing');
  return (
    <WheelPickerPrimitive.WheelPicker
      classNames={{
        optionItem: "text-gray-400",
        highlightWrapper: "bg-purple-900/30 text-white border-2 border-purple-600",
        ...classNames,
      }}
      onChange={(val) => {
        console.log('WheelPicker PRIMITIVE onChange called! Value:', val);
        if (onChange) onChange(val);
      }}
      {...props}
    />
  );
}

export { WheelPicker, WheelPickerWrapper };
