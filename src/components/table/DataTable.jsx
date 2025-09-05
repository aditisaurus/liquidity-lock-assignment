import React, { memo, useCallback, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  Tooltip,
  Fade,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { usePoints } from "../../hooks/usePoints";

// Memoized table row component with ref for auto-scroll
const TableRowComponent = memo(
  ({ point, isHighlighted, onHover, onEdit, onDelete, rowRef }) => {
    const handleMouseEnter = useCallback(
      () => onHover(point.id),
      [onHover, point.id]
    );
    const handleMouseLeave = useCallback(() => onHover(null), [onHover]);
    const handleEdit = useCallback(
      (e) => {
        e.stopPropagation();
        onEdit(point);
      },
      [onEdit, point]
    );
    const handleDelete = useCallback(
      (e) => {
        e.stopPropagation();
        onDelete(point.id);
      },
      [onDelete, point.id]
    );

    return (
      <TableRow
        ref={rowRef}
        hover
        selected={isHighlighted}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          cursor: "pointer",
          backgroundColor: isHighlighted ? "action.hover" : "inherit",
          "&:hover": {
            backgroundColor: "action.hover",
          },
          transition: "background-color 0.2s ease",
        }}
      >
        <TableCell align="center">
          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
            {point.id.slice(-8)}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Typography variant="body2">{point.x.toFixed(2)}</Typography>
        </TableCell>
        <TableCell align="center">
          <Typography variant="body2">{point.y.toFixed(2)}</Typography>
        </TableCell>
        <TableCell align="center">
          <Tooltip title="Edit coordinates">
            <IconButton
              size="small"
              color="primary"
              onClick={handleEdit}
              aria-label="edit point"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete point">
            <IconButton
              size="small"
              color="error"
              onClick={handleDelete}
              aria-label="delete point"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  }
);

TableRowComponent.displayName = "TableRowComponent";

const DataTable = () => {
  const {
    points,
    highlightedPoint,
    pointsCount,
    deletePoint,
    highlightPoint,
    clearHighlight,
    startEditingPoint,
  } = usePoints();

  // Container + per-row refs for auto-scroll
  const containerRef = useRef(null);
  const rowRefs = useRef({}); // { [pointId]: HTMLTableRowElement }

  const handleRowHover = useCallback(
    (pointId) => {
      if (pointId) {
        highlightPoint(pointId);
      } else {
        clearHighlight();
      }
    },
    [highlightPoint, clearHighlight]
  );

  const handlePointEdit = useCallback(
    (point) => {
      startEditingPoint(point);
    },
    [startEditingPoint]
  );

  const handlePointDelete = useCallback(
    (pointId) => {
      deletePoint(pointId);
    },
    [deletePoint]
  );

  // Auto-scroll to highlighted row when highlight changes (from graph/table)
  useEffect(() => {
    if (!highlightedPoint) return;
    const container = containerRef.current;
    const rowEl = rowRefs.current[highlightedPoint];
    if (!container || !rowEl) return;

    const rowTop = rowEl.offsetTop;
    const rowBottom = rowTop + rowEl.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;

    // If the row is outside the visible area, scroll it into view (centered)
    if (rowTop < visibleTop || rowBottom > visibleBottom) {
      const targetTop =
        rowTop - container.clientHeight / 2 + rowEl.offsetHeight / 2;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    }
  }, [highlightedPoint]);

  return (
    <Paper
      elevation={3}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid rgba(224, 224, 224, 1)" }}>
        <Typography variant="h6" component="div">
          Data Points Table
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Hover to highlight • Click edit to modify coordinates
        </Typography>
      </Box>

      <TableContainer ref={containerRef} sx={{ flexGrow: 1, overflow: "auto" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  width: "30%",
                  bgcolor: "background.paper",
                }}
              >
                Point ID
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  width: "20%",
                  bgcolor: "background.paper",
                }}
              >
                X Coordinate
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  width: "20%",
                  bgcolor: "background.paper",
                }}
              >
                Y Coordinate
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  width: "30%",
                  bgcolor: "background.paper",
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {points.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Fade in timeout={500}>
                    <Box sx={{ py: 5 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        No data points yet
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Double-click on the graph to add points
                      </Typography>
                    </Box>
                  </Fade>
                </TableCell>
              </TableRow>
            ) : (
              points.map((point) => (
                <TableRowComponent
                  key={point.id}
                  point={point}
                  isHighlighted={highlightedPoint === point.id}
                  onHover={handleRowHover}
                  onEdit={handlePointEdit}
                  onDelete={handlePointDelete}
                  rowRef={(el) => {
                    if (el) rowRefs.current[point.id] = el;
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pointsCount > 0 && (
        <Box
          sx={{
            p: 1.5,
            borderTop: "1px solid rgba(224, 224, 224, 1)",
            bgcolor: "grey.50",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Total Points: {pointsCount}
          </Typography>
          {pointsCount > 10 && (
            <Typography variant="caption" color="text.secondary">
              Scroll to see more
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default memo(DataTable);
