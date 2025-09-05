/**
 * Central export file for all graph-related utilities and constants
 * Import from this file for cleaner imports in components
 */

// Re-export all constants
export * from "../../constants/graphConstants";

// Re-export all utilities
export {
  formatters,
  mathUtils,
  idUtils,
  dataUtils,
  scaleUtils,
  viewportUtils,
} from "../graphUtils";

// Create convenient grouped exports
export { formatters as format } from "../graphUtils";
export { mathUtils as math } from "../graphUtils";
export { idUtils as id } from "../graphUtils";
export { dataUtils as data } from "../graphUtils";
export { scaleUtils as scale } from "../graphUtils";
export { viewportUtils as viewport } from "../graphUtils";

// Export commonly used functions directly
export { formatters as fmt } from "../graphUtils";

export const { clamp, distance, distanceSquared, isWithinBounds } = mathUtils;

export const { generateId, generateCoordinateId, generateSequentialId } =
  idUtils;

export const {
  sortByX,
  sortByY,
  calculateDomainWithPadding,
  findPointById,
  updatePoint,
  removePoint,
} = dataUtils;

// Create a default formatter export
export const defaultFormatter = formatters.formatSI;
