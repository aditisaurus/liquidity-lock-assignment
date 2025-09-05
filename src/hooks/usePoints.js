// src/hooks/usePoints.js
import { useRecoilState, useRecoilValue, useSetRecoilState, useResetRecoilState } from 'recoil';
import { useCallback } from 'react';
import { 
  pointsState, 
  highlightedPointState, 
  editingPointState,
  pointsCountSelector,
  pointsBoundingBoxSelector 
} from '../store/atoms';

export const usePoints = () => {
  const [points, setPoints] = useRecoilState(pointsState);
  const [highlightedPoint, setHighlightedPoint] = useRecoilState(highlightedPointState);
  const [editingPoint, setEditingPoint] = useRecoilState(editingPointState);
  const pointsCount = useRecoilValue(pointsCountSelector);
  const boundingBox = useRecoilValue(pointsBoundingBoxSelector);
  const resetPoints = useResetRecoilState(pointsState);

  // Add a new point
  const addPoint = useCallback((x, y) => {
    const newPoint = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      createdAt: Date.now()
    };
    
    setPoints(prevPoints => [...prevPoints, newPoint]);
    return newPoint;
  }, [setPoints]);

  // Update an existing point
  const updatePoint = useCallback((id, x, y) => {
    setPoints(prevPoints => 
      prevPoints.map(point =>
        point.id === id
          ? { 
              ...point, 
              x: Math.round(x * 100) / 100, 
              y: Math.round(y * 100) / 100,
              updatedAt: Date.now()
            }
          : point
      )
    );
  }, [setPoints]);

  // Delete a point
  const deletePoint = useCallback((id) => {
    setPoints(prevPoints => prevPoints.filter(point => point.id !== id));
    
    // Clear highlighting if deleted point was highlighted
    if (highlightedPoint === id) {
      setHighlightedPoint(null);
    }
    
    // Close edit dialog if deleted point was being edited
    if (editingPoint?.id === id) {
      setEditingPoint(null);
    }
  }, [setPoints, highlightedPoint, setHighlightedPoint, editingPoint, setEditingPoint]);

  // Batch update multiple points (for performance)
  const batchUpdatePoints = useCallback((updates) => {
    setPoints(prevPoints => {
      const updateMap = new Map(updates.map(u => [u.id, u]));
      return prevPoints.map(point => {
        const update = updateMap.get(point.id);
        return update ? { ...point, ...update, updatedAt: Date.now() } : point;
      });
    });
  }, [setPoints]);

  // Clear all points
  const clearAllPoints = useCallback(() => {
    resetPoints();
    setHighlightedPoint(null);
    setEditingPoint(null);
  }, [resetPoints, setHighlightedPoint, setEditingPoint]);

  // Set highlight
  const highlightPoint = useCallback((id) => {
    setHighlightedPoint(id);
  }, [setHighlightedPoint]);

  // Clear highlight
  const clearHighlight = useCallback(() => {
    setHighlightedPoint(null);
  }, [setHighlightedPoint]);

  // Start editing
  const startEditingPoint = useCallback((point) => {
    setEditingPoint(point);
  }, [setEditingPoint]);

  // Stop editing
  const stopEditingPoint = useCallback(() => {
    setEditingPoint(null);
  }, [setEditingPoint]);

  return {
    // State
    points,
    highlightedPoint,
    editingPoint,
    pointsCount,
    boundingBox,
    
    // Actions
    addPoint,
    updatePoint,
    deletePoint,
    batchUpdatePoints,
    clearAllPoints,
    highlightPoint,
    clearHighlight,
    startEditingPoint,
    stopEditingPoint,
    setPoints
  };
};