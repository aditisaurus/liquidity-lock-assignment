// src/store/atoms.js
import { atom, selector } from 'recoil';

// Main points state atom
export const pointsState = atom({
  key: 'pointsState',
  default: [],
  effects: [
    // Persist to localStorage
    ({ setSelf, onSet }) => {
      // Load from localStorage on init
      const savedPoints = localStorage.getItem('graphPoints');
      if (savedPoints) {
        try {
          setSelf(JSON.parse(savedPoints));
        } catch (error) {
          console.error('Failed to load saved points:', error);
        }
      }

      // Save to localStorage on change
      onSet((newValue, _, isReset) => {
        isReset
          ? localStorage.removeItem('graphPoints')
          : localStorage.setItem('graphPoints', JSON.stringify(newValue));
      });
    },
  ],
});

// Highlighted point state
export const highlightedPointState = atom({
  key: 'highlightedPointState',
  default: null,
});

// Currently editing point state
export const editingPointState = atom({
  key: 'editingPointState',
  default: null,
});

// Selectors for derived state
export const pointsCountSelector = selector({
  key: 'pointsCountSelector',
  get: ({ get }) => {
    const points = get(pointsState);
    return points.length;
  },
});

export const pointByIdSelector = selector({
  key: 'pointByIdSelector',
  get: (id) => ({ get }) => {
    const points = get(pointsState);
    return points.find(point => point.id === id);
  },
});

export const pointsBoundingBoxSelector = selector({
  key: 'pointsBoundingBoxSelector',
  get: ({ get }) => {
    const points = get(pointsState);
    if (points.length === 0) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    }
    
    const xValues = points.map(p => p.x);
    const yValues = points.map(p => p.y);
    
    return {
      minX: Math.min(...xValues) - 10,
      maxX: Math.max(...xValues) + 10,
      minY: Math.min(...yValues) - 10,
      maxY: Math.max(...yValues) + 10,
    };
  },
});

// Sorted points selector (for line drawing)
export const sortedPointsSelector = selector({
  key: 'sortedPointsSelector',
  get: ({ get }) => {
    const points = get(pointsState);
    return [...points].sort((a, b) => a.x - b.x);
  },
});