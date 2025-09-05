import React, { memo, useRef, useEffect, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Box, Typography, Tooltip, Fade,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PropTypes from "prop-types";

// Defaults: compact display, full value in tooltip
const defaultDisplay = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 2,
});
const defaultFull = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});
const defaultNumberFormatter = {
  display: (n) => defaultDisplay.format(n),
  tooltip: (n) => defaultFull.format(n),
};

// Row
const TableRowComponent = memo(function TableRowComponent({
  point,
  isHighlighted,
  onHover,
  onEdit,
  onDelete,
  rowRef,
  numberFormatter,
}) {
  const handleMouseEnter = useCallback(() => onHover?.(point.id), [onHover, point.id]);
  const handleMouseLeave = useCallback(() => onHover?.(null), [onHover]);
  const handleEdit = useCallback((e) => { e.stopPropagation(); onEdit?.(point); }, [onEdit, point]);
  const handleDelete = useCallback((e) => { e.stopPropagation(); onDelete?.(point.id); }, [onDelete, point.id]);

  const fmtDisp = numberFormatter?.display || defaultNumberFormatter.display;
  const fmtTip = numberFormatter?.tooltip || defaultNumberFormatter.tooltip;

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
        "&:hover": { backgroundColor: "action.hover" },
        transition: "background-color 0.2s ease",
      }}
    >
      <TableCell align="center">
        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
          {String(point.id).slice(-8)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Tooltip title={fmtTip(point.x)}>
          <Typography variant="body2">{fmtDisp(point.x)}</Typography>
        </Tooltip>
      </TableCell>
      <TableCell align="center">
        <Tooltip title={fmtTip(point.y)}>
          <Typography variant="body2">{fmtDisp(point.y)}</Typography>
        </Tooltip>
      </TableCell>
      <TableCell align="center">
        <Tooltip title="Edit coordinates">
          <IconButton size="small" color="primary" onClick={handleEdit} aria-label="edit point">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete point">
          <IconButton size="small" color="error" onClick={handleDelete} aria-label="delete point">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

TableRowComponent.propTypes = {
  point: PropTypes.shape({ id: PropTypes.any, x: PropTypes.number, y: PropTypes.number }).isRequired,
  isHighlighted: PropTypes.bool,
  onHover: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  rowRef: PropTypes.any,
  numberFormatter: PropTypes.shape({
    display: PropTypes.func,
    tooltip: PropTypes.func,
  }),
};

// Table
/**
 * Pure, plugin-style table.
 * Props:
 *  - points: Array<{ id, x, y }>
 *  - highlightedPoint: string|null
 *  - onRowHover(id|null)
 *  - onPointEdit(point)
 *  - onPointDelete(id)
 *  - numberFormatter?: { display(n)=>string, tooltip?(n)=>string }
 */
const DataTable = memo(function DataTable({
  points,
  highlightedPoint,
  onRowHover,
  onPointEdit,
  onPointDelete,
  numberFormatter = defaultNumberFormatter,
}) {
  const containerRef = useRef(null);
  const rowRefs = useRef({}); // { [id]: HTMLTableRowElement }

  // Auto-scroll to highlighted row
  useEffect(() => {
    if (!highlightedPoint) return;
    const container = containerRef.current;
    const rowEl = rowRefs.current[highlightedPoint];
    if (!container || !rowEl) return;

    const rowTop = rowEl.offsetTop;
    const rowBottom = rowTop + rowEl.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;

    if (rowTop < visibleTop || rowBottom > visibleBottom) {
      const targetTop = rowTop - container.clientHeight / 2 + rowEl.offsetHeight / 2;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    }
  }, [highlightedPoint]);

  return (
    <Paper elevation={3} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid rgba(224, 224, 224, 1)" }}>
        <Typography variant="h6" component="div">Data Points Table</Typography>
        <Typography variant="caption" color="text.secondary">
          Hover to highlight • Click edit to modify coordinates
        </Typography>
      </Box>

      <TableContainer ref={containerRef} sx={{ flexGrow: 1, overflow: "auto" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: "bold", width: "30%", bgcolor: "background.paper" }}>
                Point ID
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", width: "20%", bgcolor: "background.paper" }}>
                X Coordinate
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", width: "20%", bgcolor: "background.paper" }}>
                Y Coordinate
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold", width: "30%", bgcolor: "background.paper" }}>
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
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
              points.map((p) => (
                <TableRowComponent
                  key={p.id}
                  point={p}
                  isHighlighted={highlightedPoint === p.id}
                  onHover={onRowHover}
                  onEdit={onPointEdit}
                  onDelete={onPointDelete}
                  numberFormatter={numberFormatter}
                  rowRef={(el) => {
                    if (el) rowRefs.current[p.id] = el;
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {points.length > 0 && (
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
            Total Points: {points.length}
          </Typography>
          {points.length > 10 && (
            <Typography variant="caption" color="text.secondary">
              Scroll to see more
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
});

DataTable.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.any.isRequired, x: PropTypes.number, y: PropTypes.number })
  ).isRequired,
  highlightedPoint: PropTypes.any,
  onRowHover: PropTypes.func,
  onPointEdit: PropTypes.func,
  onPointDelete: PropTypes.func,
  numberFormatter: PropTypes.shape({
    display: PropTypes.func,
    tooltip: PropTypes.func,
  }),
};

export default DataTable;
