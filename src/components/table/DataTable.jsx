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
import TableFooter from "./TableFooter";
import { defaultNumberFormatter } from "../../utils/numberFormatters";
import TableRowComponent from "./TableRowComponent";
import { headerCellSx } from "./styles";

const DataTable = memo(function DataTable({
  points,
  highlightedPoint,
  onRowHover,
  onPointEdit,
  onPointDelete, onExportJSON,
  onExportCSV,
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

      <TableFooter
        points={points}
        onExportJSON={onExportJSON}
        onExportCSV={onExportCSV}
      />
    </Paper>
  );
});

export default DataTable;
