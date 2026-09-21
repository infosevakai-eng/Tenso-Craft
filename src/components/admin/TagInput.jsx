import { useId, useState } from "react";

// Chip-style tag input. Enter or comma adds a tag, Backspace on an empty field
// removes the last one. Text still in the field when it loses focus is added too.
export default function TagInput({
  value = [],
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter",
  id,
  disabled = false,
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  const addTags = (raw) => {
    const parts = String(raw)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    const next = [...value];
    parts.forEach((part) => {
      if (!next.some((tag) => tag.toLowerCase() === part.toLowerCase())) next.push(part);
    });
    onChange(next);
    setDraft("");
  };

  const removeTag = (index) => onChange(value.filter((_, i) => i !== index));

  const handleChange = (e) => {
    const text = e.target.value;
    if (text.includes(",")) addTags(text);
    else setDraft(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Never let Enter submit the whole product form from this field.
      e.preventDefault();
      addTags(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div>
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.some((tag) => tag.toLowerCase() === s.toLowerCase()))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-2 focus-within:border-[#0b1c2c] focus-within:ring-2 focus-within:ring-[#0b1c2c]/10">
        {value.map((tag, index) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm text-slate-800"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              disabled={disabled}
              aria-label={`Remove ${tag}`}
              className="flex h-5 w-5 items-center justify-center rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => addTags(draft)}
          list={listId}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm text-slate-900 outline-none"
        />
      </div>
    </div>
  );
}