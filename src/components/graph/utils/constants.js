/**
 * Graph component configuration constants
 * Centralized configuration for consistent behavior across the application
 */

// Animation timing constants (in milliseconds)
export const ANIMATION_TIMING = {
  POINT_TRANSITION: 150,
  PAN_TRANSITION: 300,
  HOVER_TRANSITION: 100,
  DOUBLE_TAP_THRESHOLD: 300,
};

export const DRAG_CLICK_THRESHOLD = 9; // squared distance (≈3px movement)

// Interaction thresholds
export const INTERACTION_THRESHOLDS = {
  DRAG_THRESHOLD: 4, // pixels - minimum movement to register as drag vs click
  DOUBLE_TAP_DISTANCE: 64, // pixels squared - max distance for double tap
  VIEWPORT_PADDING: 20, // pixels - padding when checking if point is in view
  DEBOUNCE_DELAY: 16, // milliseconds - ~60fps for drag updates
};

// Default component configuration
export const DEFAULT_CONFIG = {
  MARGINS: {
    top: 20,
    right: 30,
    bottom: 40,
    left: 50,
  },
  ZOOM_EXTENT: [0.5, 40], // [min, max] zoom scale
  LOG_THRESHOLD: {
    x: 1e6,
    y: 1e6,
  },
  DIMENSIONS: {
    width: 800,
    height: 500,
  },
};

// Visual styling constants
export const VISUAL_STYLES = {
  COLORS: {
    primary: "#1976d2",
    highlight: "#ff5722",
    stroke: "white",
    grid: "rgba(0, 0, 0, 0.1)",
    axis: "black",
    tooltip: {
      background: "rgba(0, 0, 0, 0.8)",
      text: "white",
    },
  },
  SIZES: {
    pointRadius: 6,
    pointRadiusHover: 8,
    strokeWidth: 2,
    lineWidth: 2,
  },
  OPACITY: {
    grid: 0.2,
    unhighlighted: 0.35,
    full: 1,
  },
};

// D3 configuration
export const D3_CONFIG = {
  TICK_COUNT: 6,
  CURVE_TYPE: "curveLinear",
  SCALE_NICE: true,
};

// Axis labels
export const AXIS_LABELS = {
  x: "X Axis",
  y: "Y Axis",
};


