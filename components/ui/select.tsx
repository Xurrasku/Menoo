"use client";

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  disabled?: boolean;
  className?: string;
  name?: string;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, placeholder, value, onChange, disabled, className, name }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
          case "Enter":
          case " ":
            e.preventDefault();
            if (isOpen && highlightedIndex >= 0) {
              const option = options[highlightedIndex];
              onChange?.({ target: { value: option.value } });
              setIsOpen(false);
            } else {
              setIsOpen(true);
            }
            break;
          case "ArrowDown":
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
            } else {
              setHighlightedIndex((prev) =>
                prev < options.length - 1 ? prev + 1 : 0
              );
            }
            break;
          case "ArrowUp":
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
            } else {
              setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : options.length - 1
              );
            }
            break;
          case "Escape":
            e.preventDefault();
            setIsOpen(false);
            break;
          case "Tab":
            setIsOpen(false);
            break;
        }
      },
      [disabled, isOpen, highlightedIndex, options, onChange]
    );

    // Reset highlighted index when opening - sync derived state with props
    useEffect(() => {
      if (isOpen) {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    }, [isOpen, options, value]);

    // Scroll highlighted option into view
    useEffect(() => {
      if (isOpen && listRef.current && highlightedIndex >= 0) {
        const items = listRef.current.querySelectorAll("li");
        items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
      }
    }, [highlightedIndex, isOpen]);

    const handleSelect = (optionValue: string) => {
      onChange?.({ target: { value: optionValue } });
      setIsOpen(false);
    };

    return (
      <div ref={containerRef} className="relative">
        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={value || ""} />

        {/* Trigger button */}
        <button
          ref={ref}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm",
            "ring-offset-background transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isOpen && "ring-2 ring-primary/20 border-primary",
            !selectedOption && "text-slate-400",
            selectedOption && "text-slate-900",
            className
          )}
        >
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-slate-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-50 mt-2 w-full"
            >
              <ul
                ref={listRef}
                role="listbox"
                className={cn(
                  "max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white py-1",
                  "shadow-lg shadow-slate-200/50"
                )}
              >
                {options.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "relative flex cursor-pointer items-center px-4 py-3 text-sm transition-colors",
                        isHighlighted && "bg-slate-50",
                        isSelected && "text-primary font-medium",
                        !isSelected && "text-slate-700"
                      )}
                    >
                      <span className="flex-1">{option.label}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
