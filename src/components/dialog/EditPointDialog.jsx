import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  Slide,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import debounce from "lodash.debounce";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const parseNumber = (v) => {
  if (v === "" || v === null || v === undefined) return { ok: false };
  const n = Number(v);
  return Number.isFinite(n) ? { ok: true, n } : { ok: false };
};

/**
 * Controlled popup editor (pure component).
 * Props:
 *  - open: boolean
 *  - point: { id, x, y } | null
 *  - onClose(): void
 *  - onSave(updatedPoint): void
 *  - onLiveChange?(updatedPoint): void    // 👈 debounced as you type
 *  - bounds?: { minX, maxX, minY, maxY }  // optional validation/labels
 */
const EditPointDialog = memo(function EditPointDialog({
  open,
  point,
  onClose,
  onSave,
  onLiveChange,
  bounds,
}) {
  const [formData, setFormData] = useState({ x: "", y: "" });
  const [errors, setErrors] = useState({ x: "", y: "" });
  const [touched, setTouched] = useState({ x: false, y: false });
  const [saveError, setSaveError] = useState("");

  // Debounced live callback
  const debouncedLive = useMemo(
    () => debounce((p) => onLiveChange && onLiveChange(p), 120),
    [onLiveChange]
  );
  useEffect(() => () => debouncedLive.cancel(), [debouncedLive]);

  // Seed state on open/point change
  useEffect(() => {
    if (open && point) {
      setFormData({ x: String(point.x), y: String(point.y) });
      setErrors({ x: "", y: "" });
      setTouched({ x: false, y: false });
      setSaveError("");
    } else {
      setFormData({ x: "", y: "" });
      setErrors({ x: "", y: "" });
      setTouched({ x: false, y: false });
      setSaveError("");
    }
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
        const ok = runValidation(next);
        if (ok) pushLiveIfValid(next);
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      keepMounted
      fullWidth
      maxWidth="xs"
      onKeyDown={handleKeyDown}
      aria-labelledby="edit-point-title"
      // lighten the backdrop so you can see graph/table behind
      slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.2)" } } }}
    >
      <DialogTitle id="edit-point-title" sx={{ pr: 6 }}>
        Edit Coordinates
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {saveError && (
          <Box mb={2}>
            <Alert severity="error">{saveError}</Alert>
          </Box>
        )}

        {point && (
          <Stack spacing={2}>
            <TextField
              label="Point ID"
              value={String(point.id)}
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <TextField
              name="x"
              label={xLabel}
              value={formData.x}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.x}
              helperText={errors.x || "Live updates while typing"}
              inputMode="decimal"
              fullWidth
              autoFocus
              size="small"
            />
            <TextField
              name="y"
              label={yLabel}
              value={formData.y}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.y}
              helperText={errors.y || "Drag on graph or edit here"}
              inputMode="decimal"
              fullWidth
              size="small"
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="text">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default EditPointDialog;
