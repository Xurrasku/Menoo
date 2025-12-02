"use client";

import { useEffect, useState } from "react";
import { Pencil, Check } from "lucide-react";

import { cn } from "@/lib/utils";

type MenuNameEditorProps = {
  menuId: string;
  initialValue: string;
  onChange?: (menuId: string, value: string) => void;
  className?: string;
  textClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  isEditable?: boolean;
};

export function MenuNameEditor({
  menuId,
  initialValue,
  onChange,
  className,
  textClassName,
  inputClassName,
  buttonClassName,
  isEditable = true,
}: MenuNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const toggleEditing = () => {
    if (!isEditable) {
      return;
    }

    if (isEditing) {
      const nextValue = value.trim() || initialValue;
      setValue(nextValue);
      onChange?.(menuId, nextValue);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div className={cn("flex w-full items-center gap-[1.5%] sm:gap-2", className)}>
      {isEditable && isEditing ? (
        <input
          className={cn(
            "flex-1 border-none bg-transparent px-0 py-0 text-[3.2vw] font-semibold text-slate-900 outline-none focus:outline-none sm:text-base",
            inputClassName
          )}
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            setValue(nextValue);
            onChange?.(menuId, nextValue);
          }}
          autoFocus
          aria-label="Edit menu name"
        />
      ) : (
        <span className={cn("flex-1 truncate text-[3.2vw] font-semibold text-slate-900 sm:text-base", textClassName)}>
          {value}
        </span>
      )}
      {isEditable ? (
        <button
          type="button"
          onClick={toggleEditing}
          className={cn(
            "p-[0.8%] text-slate-400 transition hover:text-slate-900 sm:p-1",
            buttonClassName
          )}
          aria-label={isEditing ? "Confirm menu name" : "Edit menu name"}
        >
          {isEditing ? <Check className="h-[3.5vw] w-[3.5vw] sm:h-4 sm:w-4" /> : <Pencil className="h-[3.5vw] w-[3.5vw] sm:h-4 sm:w-4" />}
        </button>
      ) : null}
    </div>
  );
}

