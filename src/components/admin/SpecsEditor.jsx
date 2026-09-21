import { useId } from "react";

const cellClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0b1c2c] focus:ring-2 focus:ring-[#0b1c2c]/10 disabled:opacity-60";

const iconButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30";

// Ordered list of { key, value } rows (the product spec table).
// keySuggestions: spec names already used on other products (autocomplete).
export default function SpecsEditor({
  value = [],
  onChange,
  keySuggestions = [],
  disabled = false,
}) {
  const listId = useId();

  const updateRow = (index, field, next) =>
    onChange(value.map((row, i) => (i === index ? { ...row, [field]: next } : row)));

  const removeRow = (index) => onChange(value.filter((_, i) => i !== index));

  const moveRow = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const addRow = () => onChange([...value, { key: "", value: "" }]);

  return (
    <div>
      <datalist id={listId}>
        {keySuggestions.map((key) => (
          <option key={key} value={key} />
        ))}
      </datalist>

      {value.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500">
          No specs yet. They appear as a table on the product page.
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]"
            >
              <input
                type="text"
                value={row.key}
                onChange={(e) => updateRow(index, "key", e.target.value)}
                list={listId}
                disabled={disabled}
                placeholder="Fabric GSM"
                aria-label={`Spec ${index + 1} name`}
                className={cellClass}
              />
              <div className="col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto">
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => updateRow(index, "value", e.target.value)}
                  disabled={disabled}
                  placeholder="900 GSM"
                  aria-label={`Spec ${index + 1} value`}
                  className={cellClass}
                />
              </div>
              <div className="col-start-2 row-span-2 row-start-1 flex items-center gap-1 sm:col-start-auto sm:row-span-1 sm:row-start-auto">
                <button
                  type="button"
                  onClick={() => moveRow(index, -1)}
                  disabled={disabled || index === 0}
                  aria-label={`Move spec ${index + 1} up`}
                  className={iconButtonClass}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveRow(index, 1)}
                  disabled={disabled || index === value.length - 1}
                  aria-label={`Move spec ${index + 1} down`}
                  className={iconButtonClass}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  disabled={disabled}
                  aria-label={`Remove spec ${index + 1}`}
                  className={`${iconButtonClass} hover:border-red-200 hover:bg-red-50 hover:text-red-600`}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        disabled={disabled}
        className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        + Add spec
      </button>
    </div>
  );
}