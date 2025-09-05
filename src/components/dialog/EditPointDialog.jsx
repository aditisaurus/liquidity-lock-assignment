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
import { usePoints } from "../../hooks/usePoints";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

// Small helper to parse numbers safely (accepts "1e3" etc.)
const parseNumber = (v) => {
  if (v === "" || v === null || v === undefined) return { ok: false };
  const n = Number(v);
  if (Number.isFinite(n)) return { ok: true, n };
  return { ok: false };
};

const EditPointDialog = memo(function EditPointDialog() {
  const {
    editingPoint, // { id, x, y } | null
    updatePoint, // (id, x, y)
    stopEditingPoint, // () => void
    boundingBox, // {minX,maxX,minY,maxY}
  } = usePoints();

  const open = !!editingPoint;

  // Local form state
  const [formData, setFormData] = useState({ x: "", y: "" });
  const [errors, setErrors] = useState({ x: "", y: "" });
  const [touched, setTouched] = useState({ x: false, y: false });
  const [saveError, setSaveError] = useState("");

  // Debounced live update to reflect on graph/table as user types
  const debouncedLiveUpdate = useMemo(
    () =>
      debounce((id, x, y) => {
        updatePoint(id, x, y);
      }, 120),
    [updatePoint]
  );

  // Cancel any pending debounced calls on unmount/recreate
  useEffect(() => {
    return () => {
      debouncedLiveUpdate.cancel();
    };
  }, [debouncedLiveUpdate]);

  // When dialog opens or the editingPoint changes externally, seed the form
  useEffect(() => {
    if (editingPoint) {
      setFormData({
        x: editingPoint.x.toString(),
        y: editingPoint.y.toString(),
      });
      setErrors({ x: "", y: "" });
      setTouched({ x: false, y: false });
      setSaveError("");
    } else {
      // Clean up when closed
      setFormData({ x: "", y: "" });
      setErrors({ x: "", y: "" });
      setTouched({ x: false, y: false });
      setSaveError("");
    }
  }, [editingPoint]);

  // Validation
  const validateField = useCallback(
    (name, value) => {
      if (value === "") return `${name.toUpperCase()} is required`;
      const parsed = parseNumber(value);
      if (!parsed.ok) return `${name.toUpperCase()} must be a valid number`;

      const n = parsed.n;
      if (name === "x") {
        if (n < boundingBox.minX || n > boundingBox.maxX) {
          return `X must be between ${boundingBox.minX} and ${boundingBox.maxX}`;
        }
      } else {
        if (n < boundingBox.minY || n > boundingBox.maxY) {
          return `Y must be between ${boundingBox.minY} and ${boundingBox.maxY}`;
        }
      }
      return "";
    },
    [boundingBox]
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

  // Live-update graph as user types valid values
  const pushLiveUpdateIfValid = useCallback(
    (nextForm) => {
      if (!editingPoint) return;

      const px = parseNumber(nextForm.x);
      const py = parseNumber(nextForm.y);
      if (!px.ok || !py.ok) return;

      // Clamp to bounding box for robustness
      const nx = clamp(px.n, boundingBox.minX, boundingBox.maxX);
      const ny = clamp(py.n, boundingBox.minY, boundingBox.maxY);

      debouncedLiveUpdate(editingPoint.id, nx, ny);
    },
    [debouncedLiveUpdate, editingPoint, boundingBox]
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target; // name === 'x' | 'y'
      const next = { ...formData, [name]: value };
      setFormData(next);

      // If already touched, re-validate on change
      if (touched[name]) {
        const ok = runValidation(next);
        if (ok) pushLiveUpdateIfValid(next);
      } else {
        // Still push live update if it's valid even before blur
        pushLiveUpdateIfValid(next);
      }
    },
    [formData, touched, runValidation, pushLiveUpdateIfValid]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouched((t) => ({ ...t, [name]: true }));
      runValidation(formData);
    },
    [formData, runValidation]
  );

  const handleClose = useCallback(() => {
    stopEditingPoint();
  }, [stopEditingPoint]);

  const handleSave = useCallback(() => {
    if (!editingPoint) return;

    const ok = runValidation(formData);
    if (!ok) {
      setSaveError("Please fix validation errors before saving.");
      return;
    }

    const px = parseNumber(formData.x);
    const py = parseNumber(formData.y);
    if (!px.ok || !py.ok) {
      setSaveError("Please enter valid numeric values.");
      return;
    }

    const nx = clamp(px.n, boundingBox.minX, boundingBox.maxX);
    const ny = clamp(py.n, boundingBox.minY, boundingBox.maxY);

    // Final update (non-debounced) to ensure exact saved values
    updatePoint(editingPoint.id, nx, ny);
    setSaveError("");
    stopEditingPoint();
  }, [
    editingPoint,
    formData,
    runValidation,
    boundingBox,
    updatePoint,
    stopEditingPoint,
  ]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleClose, handleSave]
  );

  const isSaveDisabled = useMemo(() => {
    if (!editingPoint) return true;
    // Disable if any error present or fields empty
    if (!formData.x || !formData.y) return true;
    return Boolean(errors.x || errors.y);
  }, [editingPoint, formData, errors]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      keepMounted
      fullWidth
      maxWidth="xs"
      onKeyDown={handleKeyDown}
      aria-labelledby="edit-point-title"
    >
      <DialogTitle id="edit-point-title" sx={{ pr: 6 }}>
        Edit Coordinates
        <IconButton
          aria-label="close"
          onClick={handleClose}
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

        {editingPoint && (
          <Stack spacing={2}>
            <TextField
              label="Point ID"
              value={editingPoint.id.slice(-12)}
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <TextField
              name="x"
              label={`X (${boundingBox.minX} – ${boundingBox.maxX})`}
              value={formData.x}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!errors.x}
              helperText={
                errors.x || "Use numbers; updates reflect live on graph"
              }
              inputMode="decimal"
              fullWidth
              autoFocus
              size="small"
            />
            <TextField
              name="y"
              label={`Y (${boundingBox.minY} – ${boundingBox.maxY})`}
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
        <Button onClick={handleClose} variant="text">
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
