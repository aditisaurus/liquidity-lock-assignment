import React, { memo, useCallback, forwardRef } from "react";
import {
  TableRow,
  TableCell,
  Tooltip,
  Typography,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { defaultNumberFormatter } from "../../utils/numberFormatters";

const TableRowComponent = memo(
  forwardRef(function TableRowComponent(
    { point, isHighlighted, onHover, onEdit, onDelete, numberFormatter },
    ref
  ) {
    const fmt = numberFormatter || defaultNumberFormatter;

    const handleMouseEnter = useCallback(
      () => onHover?.(point.id),
      [onHover, point.id]
    );
    const handleMouseLeave = useCallback(() => onHover?.(null), [onHover]);
    const handleEdit = useCallback(
      (e) => {
        e.stopPropagation();
        onEdit?.(point);
      },
      [onEdit, point]
    );
    const handleDelete = useCallback(
      (e) => {
        e.stopPropagation();
        onDelete?.(point.id);
      },
      [onDelete, point.id]
    );

    return (
      <TableRow
        ref={ref}
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
          <Tooltip title={fmt.tooltip(point.x)}>
            <Typography variant="body2">{fmt.display(point.x)}</Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <Tooltip title={fmt.tooltip(point.y)}>
            <Typography variant="body2">{fmt.display(point.y)}</Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <Tooltip title="Edit coordinates">
            <IconButton size="small" color="primary" onClick={handleEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete point">
            <IconButton size="small" color="error" onClick={handleDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  })
);

export default TableRowComponent;
