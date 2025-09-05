import * as d3 from "d3";

/**
 * Graph utility functions
 * Pure functions with no side effects for graph operations
 */

// Formatting utilities
const SI_FORMAT = d3.format(".2s");

export const formatters = {
  /**
   * Format number with SI units (K, M, B instead of G)
   * @param {number} n - Number to format
   * @returns {string} Formatted string
   */
  formatSI: (n) => SI_FORMAT(n).replace("G", "B"),

  /**
   * Format number with commas
   * @param {number} n - Number to format
   * @returns {string} Formatted string
   */
  formatComma: d3.format(","),

  /**
   * Format number with fixed decimal places
   * @param {number} places - Number of decimal places
   * @returns {Function} Formatter function
   */
  formatDecimal: (places = 2) => d3.format(`.${places}f`),

  /**
   * Format percentage
   * @param {number} n - Number to format (0-1)
   * @returns {string} Formatted percentage
   */
  formatPercent: d3.format(".1%"),
};

// Math utilities
export const mathUtils = {
  /**
   * Clamp a value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),

  /**
   * Calculate distance between two points
   * @param {number} x1 - First point x
   * @param {number} y1 - First point y
   * @param {number} x2 - Second point x
   * @param {number} y2 - Second point y
   * @returns {number} Euclidean distance
   */
  distance: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),

  /**
   * Calculate distance squared (avoids sqrt for performance)
   * @param {number} x1 - First point x
   * @param {number} y1 - First point y
   * @param {number} x2 - Second point x
   * @param {number} y2 - Second point y
   * @returns {number} Distance squared
   */
  distanceSquared: (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2,

  /**
   * Check if point is within bounds
   * @param {number} x - Point x coordinate
   * @param {number} y - Point y coordinate
   * @param {Object} bounds - Bounds object {x1, y1, x2, y2}
   * @returns {boolean} True if point is within bounds
   */
  isWithinBounds: (x, y, bounds) =>
    x >= bounds.x1 && x <= bounds.x2 && y >= bounds.y1 && y <= bounds.y2,
};

// ID generation utilities
export const idUtils = {
  /**
   * Generate a unique ID for graph elements
   * @param {string} prefix - Optional prefix for the ID
   * @returns {string} Unique ID
   */
  generateId: (prefix = "") => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 8);
    return prefix
      ? `${prefix}-${timestamp}-${random}`
      : `${timestamp}${random}`;
  },

  /**
   * Generate a deterministic ID based on coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {string} Deterministic ID
   */
  generateCoordinateId: (x, y) => `point-${x.toFixed(2)}-${y.toFixed(2)}`,

  /**
   * Generate a sequential ID
   * @param {number} index - Index number
   * @param {string} prefix - Optional prefix
   * @returns {string} Sequential ID
   */
  generateSequentialId: (index, prefix = "point") => `${prefix}-${index}`,
};

// Data processing utilities
export const dataUtils = {
  /**
   * Sort points by x coordinate
   * @param {Array} points - Array of points with x property
   * @returns {Array} Sorted array
   */
  sortByX: (points) => [...points].sort((a, b) => a.x - b.x),

  /**
   * Sort points by y coordinate
   * @param {Array} points - Array of points with y property
   * @returns {Array} Sorted array
   */
  sortByY: (points) => [...points].sort((a, b) => a.y - b.y),

  /**
   * Calculate domain with padding
   * @param {Array} values - Array of numeric values
   * @param {number} paddingPercent - Padding as percentage (default 5%)
   * @returns {Array} [min, max] with padding
   */
  calculateDomainWithPadding: (values, paddingPercent = 0.05) => {
    if (!values.length) return [0, 100];

    const extent = d3.extent(values);
    const padding = (extent[1] - extent[0]) * paddingPercent || 5;

    return [extent[0] - padding, extent[1] + padding];
  },

  /**
   * Find point by ID
   * @param {Array} points - Array of points
   * @param {string} id - Point ID to find
   * @returns {Object|undefined} Found point or undefined
   */
  findPointById: (points, id) => points.find((p) => p.id === id),

  /**
   * Update point in array immutably
   * @param {Array} points - Array of points
   * @param {string} id - Point ID to update
   * @param {Object} updates - Updates to apply
   * @returns {Array} New array with updated point
   */
  updatePoint: (points, id, updates) =>
    points.map((p) => (p.id === id ? { ...p, ...updates } : p)),

  /**
   * Remove point from array immutably
   * @param {Array} points - Array of points
   * @param {string} id - Point ID to remove
   * @returns {Array} New array without the point
   */
  removePoint: (points, id) => points.filter((p) => p.id !== id),
};

// Scale utilities
export const scaleUtils = {
  /**
   * Determine scale type based on data range
   * @param {Array} domain - Data domain [min, max]
   * @param {number} threshold - Threshold for log scale
   * @returns {string} Scale type ('linear', 'log', or 'symlog')
   */
  determineScaleType: (domain, threshold = 1e6) => {
    const span = Math.abs(domain[1] - domain[0]);
    const hasNegative = domain[0] < 0;

    if (span >= threshold) {
      return hasNegative ? "symlog" : "log";
    }
    return "linear";
  },

  /**
   * Create appropriate D3 scale
   * @param {string} type - Scale type
   * @param {Array} domain - Data domain
   * @param {Array} range - Pixel range
   * @returns {Object} D3 scale
   */
  createScale: (type, domain, range) => {
    let scale;

    switch (type) {
      case "log":
        scale = d3.scaleLog();
        break;
      case "symlog":
        scale = d3.scaleSymlog().constant(1);
        break;
      case "pow":
        scale = d3.scalePow().exponent(2);
        break;
      case "sqrt":
        scale = d3.scaleSqrt();
        break;
      default:
        scale = d3.scaleLinear();
    }

    return scale.domain(domain).range(range).nice();
  },
};

// Viewport utilities
export const viewportUtils = {
  /**
   * Check if point is visible in viewport
   * @param {number} x - Point x in screen coordinates
   * @param {number} y - Point y in screen coordinates
   * @param {Object} viewport - Viewport dimensions {width, height}
   * @param {number} padding - Padding from edges
   * @returns {boolean} True if visible
   */
  isPointVisible: (x, y, viewport, padding = 20) => {
    return (
      x >= padding &&
      x <= viewport.width - padding &&
      y >= padding &&
      y <= viewport.height - padding
    );
  },

  /**
   * Calculate transform to center point
   * @param {Object} point - Point to center {x, y}
   * @param {Object} viewport - Viewport dimensions
   * @param {Object} scale - Current scale
   * @param {number} zoom - Current zoom level
   * @returns {Object} Transform {x, y, k}
   */
  calculateCenterTransform: (point, viewport, scale, zoom = 1) => {
    const baseX = scale.xScale(point.x);
    const baseY = scale.yScale(point.y);

    return {
      x: viewport.width / 2 - zoom * baseX,
      y: viewport.height / 2 - zoom * baseY,
      k: zoom,
    };
  },
};
