import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import debounce from "lodash.debounce";
import { clamp, parseNumber } from "./utils";
import {
  DEBOUNCE_DELAY,
  DEFAULT_FORM,
  DEFAULT_ERRORS,
  DEFAULT_TOUCHED,
} from "./constants";

const EditPointDialog = memo(function EditPointDialog({
  open,
  point,
  onClose,
  onSave,
  onLiveChange,
  bounds,
}) {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState(DEFAULT_ERRORS);
  const [touched, setTouched] = useState(DEFAULT_TOUCHED);
  const [saveError, setSaveError] = useState("");

  // Debounced live callback
  const debouncedLive = useMemo(
    () => debounce((p) => onLiveChange && onLiveChange(p), DEBOUNCE_DELAY),
    [onLiveChange]
  );
  useEffect(() => () => debouncedLive.cancel(), [debouncedLive]);

  // Reset state on open/point change
  useEffect(() => {
    if (open && point) {
      setFormData({ x: String(point.x), y: String(point.y) });
    } else {
      setFormData(DEFAULT_FORM);
    }
    setErrors(DEFAULT_ERRORS);
    setTouched(DEFAULT_TOUCHED);
    setSaveError("");
  }, [open, point]);

  const validateField = useCallback(
    (name, value) => {
      if (value === "") return `${name.toUpperCase()} is required`;
      const parsed = parseNumber(value);
      if (!parsed.ok) return `${name.toUpperCase()} must be a valid number`;

      if (bounds) {
        const { minX, maxX, minY, maxY } = bounds;
        const n = parsed.n;
        if (name === "x" && (n < minX || n > maxX))
          return `X must be between ${minX} and ${maxX}`;
        if (name === "y" && (n < minY || n > maxY))
          return `Y must be between ${minY} and ${maxY}`;
      }
      return "";
    },
    [bounds]
  );

  const runValidation = useCallback(
    (nextForm) => {
      const eX = validateField("x", nextForm.x);
      const eY = validateField("y", nextForm.y);
      setErrors({ x: eX, y: eY });
      return !eX && !eY;
    },
    [validateField]
  );

  const pushLiveIfValid = useCallback(
    (nextForm) => {
      if (!point) return;
      const px = parseNumber(nextForm.x);
      const py = parseNumber(nextForm.y);
      if (!px.ok || !py.ok) return;

      let nx = px.n,
        ny = py.n;
      if (bounds) {
        nx = clamp(nx, bounds.minX, bounds.maxX);
        ny = clamp(ny, bounds.minY, bounds.maxY);
      }
      debouncedLive({ ...point, x: nx, y: ny });
    },
    [debouncedLive, bounds, point]
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const next = { ...formData, [name]: value };
      setFormData(next);

      if (touched[name]) {
        if (runValidation(next)) pushLiveIfValid(next);
      } else {
        pushLiveIfValid(next);
      }
    },
    [formData, touched, runValidation, pushLiveIfValid]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouched((t) => ({ ...t, [name]: true }));
      runValidation(formData);
    },
    [formData, runValidation]
  );

  const handleSave = useCallback(() => {
    if (!point) return;
    const ok = runValidation(formData);
    if (!ok) return setSaveError("Please fix validation errors before saving.");

    const px = parseNumber(formData.x);
    const py = parseNumber(formData.y);
    if (!px.ok || !py.ok)
      return setSaveError("Please enter valid numeric values.");

    let nx = px.n,
      ny = py.n;
    if (bounds) {
      nx = clamp(nx, bounds.minX, bounds.maxX);
      ny = clamp(ny, bounds.minY, bounds.maxY);
    }

    onSave({ ...point, x: nx, y: ny });
    setSaveError("");
    onClose();
  }, [point, formData, bounds, onSave, onClose, runValidation]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [onClose, handleSave]
  );

  const isSaveDisabled = useMemo(() => {
    if (!open || !point) return true;
    if (!formData.x || !formData.y) return true;
    return Boolean(errors.x || errors.y);
  }, [open, point, formData, errors]);

  const xLabel = bounds ? `X (${bounds.minX} – ${bounds.maxX})` : "X";
  const yLabel = bounds ? `Y (${bounds.minY} – ${bounds.maxY})` : "Y";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-sm rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-lg font-semibold">Edit Coordinates</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {saveError && (
            <div className="mb-2 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
              {saveError}
            </div>
          )}

          {point && (
            <div className="space-y-3">
              {/* Point ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Point ID
                </label>
                <input
                  className="mt-1 w-full rounded border border-gray-300 bg-gray-100 p-2 text-sm"
                  value={point.id}
                  readOnly
                />
              </div>

              {/* X Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {xLabel}
                </label>
                <input
                  name="x"
                  value={formData.x}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 w-full rounded border p-2 text-sm ${
                    errors.x ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter X"
                />
                {errors.x && (
                  <p className="mt-1 text-xs text-red-600">{errors.x}</p>
                )}
              </div>

              {/* Y Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {yLabel}
                </label>
                <input
                  name="y"
                  value={formData.y}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`mt-1 w-full rounded border p-2 text-sm ${
                    errors.y ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter Y"
                />
                {errors.y && (
                  <p className="mt-1 text-xs text-red-600">{errors.y}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-4 py-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`rounded px-4 py-2 text-sm font-medium text-white ${
              isSaveDisabled
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
});

export default EditPointDialog;
