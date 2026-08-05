import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FiCheck,
  FiChevronDown,
} from 'react-icons/fi';

const cn = (...values) => values.filter(Boolean).join(' ');

export default function CustomSelect({
  label,
  name,
  options,
  placeholder = 'Select an option',
  required = false,
  defaultValue = '',
  onChange,
  compact = false,
}) {
  const generatedId = useId();
  const selectId = generatedId.replace(/:/g, '');
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  const openMenu = () => {
    const selectedIndex = options.findIndex(
      (option) => option.value === value
    );

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const selectOption = (option) => {
    setValue(option.value);
    setIsOpen(false);
    onChange?.(option.value);

    window.requestAnimationFrame(() => {
      buttonRef.current?.focus();
    });
  };

  const handleKeyDown = (event) => {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp'
    ) {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
        return;
      }

      setActiveIndex((currentIndex) => {
        if (event.key === 'ArrowDown') {
          return (currentIndex + 1) % options.length;
        }

        return (
          (currentIndex - 1 + options.length) %
          options.length
        );
      });

      return;
    }

    if (
      isOpen &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      selectOption(options[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    }

    if (event.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn('relative', compact && 'min-w-[190px]')}
    >
      {label && (
        <label
          id={`${selectId}-label`}
          className="block text-sm font-semibold text-slate-700"
        >
          {label}

          {required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </label>
      )}

      <input type="hidden" name={name} value={value} />

      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={
          label ? `${selectId}-label` : undefined
        }
        aria-controls={`${selectId}-options`}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'group flex w-full items-center justify-between gap-4 rounded-xl border bg-white text-left text-sm font-medium text-slate-800 shadow-sm outline-none transition-all duration-200',
          'hover:border-blue-300 hover:shadow-md',
          'focus:border-blue-500 focus:ring-4 focus:ring-blue-100',
          isOpen
            ? 'border-blue-500 ring-4 ring-blue-100'
            : 'border-slate-300',
          compact ? 'px-4 py-3' : 'mt-2 px-4 py-3.5'
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            !selectedOption && 'text-slate-400'
          )}
        >
          {selectedOption?.label || placeholder}
        </span>

        <FiChevronDown
          className={cn(
            'h-5 w-5 flex-shrink-0 text-slate-500 transition-transform duration-200',
            isOpen && 'rotate-180 text-blue-600'
          )}
        />
      </button>

      {isOpen && (
        <div
          id={`${selectId}-options`}
          role="listbox"
          className="absolute z-[90] mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_55px_rgba(15,23,42,0.18)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-no-scroll-animation
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors duration-150',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>

                  {option.description && (
                    <span
                      className={cn(
                        'mt-0.5 block text-xs',
                        isActive
                          ? 'text-blue-600'
                          : 'text-slate-500'
                      )}
                    >
                      {option.description}
                    </span>
                  )}
                </span>

                {isSelected && (
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                    <FiCheck className="h-4 w-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
