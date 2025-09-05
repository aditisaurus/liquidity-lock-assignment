import React, { memo, useRef, useEffect } from "react";
import {
  Paper,
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Fade,
} from "@mui/material";

import { defaultNumberFormatter } from "../../utils/numberFormatters";
import { headerCellSx } from "../../utils/styles";
import TableRowComponent from "./TableRowComponent";

const DataTable = memo(function DataTable({
  points,
  highlightedPoint,
  onRowHover,
  onPointEdit,
  onPointDelete,
  numberFormatter = defaultNumberFormatter,
}) {
  const containerRef = useRef(null);
  const rowRefs = useRef({});

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
     {/* <Box
  sx={{
    p: 2,
    borderBottom: "1px solid rgba(224, 224, 224, 1)",
    textAlign: "center",   
  }}
>
  <Typography variant="h6" align="center">
    Data Points Table
  </Typography>

  <Typography variant="caption" color="text.secondary" align="center">
    Hover to highlight • Click edit to modify coordinates
  </Typography>
</Box> */}

      <TableContainer ref={containerRef} sx={{ flexGrow: 1, overflow: "auto" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ ...headerCellSx, width: "30%" }}>Point ID</TableCell>
              <TableCell align="center" sx={{ ...headerCellSx, width: "20%" }}>X Coordinate</TableCell>
              <TableCell align="center" sx={{ ...headerCellSx, width: "20%" }}>Y Coordinate</TableCell>
              <TableCell align="center" sx={{ ...headerCellSx, width: "30%" }}>Actions</TableCell>
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
                  ref={(el) => (rowRefs.current[p.id] = el)}
                  point={p}
                  isHighlighted={highlightedPoint === p.id}
                  onHover={onRowHover}
                  onEdit={onPointEdit}
                  onDelete={onPointDelete}
                  numberFormatter={numberFormatter}
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
            alignItems: "center",
          }}
        >
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

export default DataTable;
