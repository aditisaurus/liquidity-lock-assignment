// src/components/graph/Graph.jsx
import React, { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { Paper, Box } from "@mui/material";
import debounce from "lodash.debounce";

const si = d3.format(".2s");
const siFmt = (n) => si(n).replace("G", "B"); // 1.2G -> 1.2B
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Pure graph plugin with zoom & pan + double-click/double-tap add.
 * Auto-pans to highlighted points when they're outside the viewport.
 *
 * Props:
 *  - points: [{id,x,y}]
 *  - highlightedPoint: string|null
 *  - onPointsChange(newPoints)
 *  - onPointHover(id|null)
 *  - onPointClick(point)
 *  - width, height, margin
 *  - scaleMode: "auto" | "linear" | "log" | "symlog" (default "auto")
 *  - xTickFormat, yTickFormat: (n)=>string (optional; default SI)
 *  - logThreshold: { x: number, y: number } (when scaleMode="auto")
 *  - zoomScaleExtent?: [min,max]  (default [0.5, 40])
 */

const Graph = React.memo(function Graph({
  points = [],
  highlightedPoint = null,
  onPointsChange,
  onPointHover,
  onPointClick,
  width = 800,
  height = 500,
  margin = { top: 20, right: 30, bottom: 40, left: 50 },
  scaleMode = "auto",
  xTickFormat,
  yTickFormat,
  logThreshold = { x: 1e6, y: 1e6 },
  zoomScaleExtent = [0.5, 40],
}) {
  const svgRef = useRef(null);
  const zoomRef = React.useRef(null);
  const svgSelRef = React.useRef(null);
  // zoom/drag state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const zoomTransformRef = useRef(d3.zoomIdentity);

  // current (zoomed) scales
  const currentScalesRef = useRef({ xScale: null, yScale: null });

  // ids (per-instance) for clipPath and tooltip
  const clipIdRef = useRef(`clip-${Math.random().toString(36).slice(2)}`);
  const tooltipIdRef = useRef(`tt-${Math.random().toString(36).slice(2)}`);

  // for double-tap
  const lastTapRef = useRef({ t: 0, x: 0, y: 0 });

  const sortedPoints = useMemo(() => [...points].sort((a, b) => a.x - b.x), [points]);

  const dimensions = useMemo(
    () => ({
      innerWidth: width - margin.left - margin.right,
      innerHeight: height - margin.top - margin.bottom,
    }),
    [width, height, margin]
  );

  // Data-driven domains with padding
  const domains = useMemo(() => {
    if (!points.length) return { x: [0, 100], y: [0, 100] };
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const dx = (d3.max(xs) - d3.min(xs)) * 0.05 || 5;
    const dy = (d3.max(ys) - d3.min(ys)) * 0.05 || 5;
    return {
      x: [d3.min(xs) - dx, d3.max(xs) + dx],
      y: [d3.min(ys) - dy, d3.max(ys) + dy],
    };
  }, [points]);

  // Base scales (pre-zoom)
  const makeBaseScale = (domain, axis) => {
    const { innerWidth, innerHeight } = dimensions;
    const range = axis === "x" ? [0, innerWidth] : [innerHeight, 0];
    const span = Math.abs(domain[1] - domain[0]);
    const wantsSymlog = span >= (axis === "x" ? logThreshold.x : logThreshold.y);
    const mode = scaleMode === "auto" ? (wantsSymlog ? "symlog" : "linear") : scaleMode;

    if (mode === "log") {
      const min = Math.min(...domain);
      if (min <= 0) return d3.scaleSymlog().constant(1).domain(domain).range(range).nice();
      return d3.scaleLog().domain(domain).range(range).nice();
    }
    if (mode === "symlog") {
      return d3.scaleSymlog().constant(1).domain(domain).range(range).nice();
    }
    return d3.scaleLinear().domain(domain).range(range).nice();
  };

  const baseScales = useMemo(
    () => ({
      xScale: makeBaseScale(domains.x, "x"),
      yScale: makeBaseScale(domains.y, "y"),
    }),
    [domains, dimensions, scaleMode, logThreshold]
  );

  // Debounced updater while dragging
  const debouncedUpdateRef = useRef(null);
  if (!debouncedUpdateRef.current) {
    debouncedUpdateRef.current = debounce((id, x, y, prevPoints, cb) => {
      cb(prevPoints.map((p) => (p.id === id ? { ...p, x, y } : p)));
    }, 16);
  }

  useEffect(() => {
    if (!svgRef.current) return;

    const { innerWidth, innerHeight } = dimensions;
    const svg = d3.select(svgRef.current);
    svgSelRef.current = svg;
    svg.selectAll("*").remove();
    svg.style("cursor", "grab"); // default hand cursor

    // Root group (with margins)
    const g = svg
      .append("g")
      .attr("class", "main-group")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- CLIP PATH (keeps path/points inside axes) ---
    const clipId = clipIdRef.current;
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("x", 0)
      .attr("y", 0);

    // Axes & grids (not clipped)
    const xFmt = xTickFormat || siFmt;
    const yFmt = yTickFormat || siFmt;

    const gridX = g.append("g").attr("class", "grid x-grid").attr("transform", `translate(0,${innerHeight})`);
    const gridY = g.append("g").attr("class", "grid y-grid");
    const axX = g.append("g").attr("class", "x-axis").attr("transform", `translate(0,${innerHeight})`);
    const axY = g.append("g").attr("class", "y-axis");

    axX
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 35)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("X Axis");

    axY
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -innerHeight / 2)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("Y Axis");

    // Plot area (clipped group)
    const plot = g
      .append("g")
      .attr("class", "plot-area")
      .attr("clip-path", `url(#${clipId})`);
    // Path & points
    const path = plot.append("path").attr("fill", "none").attr("stroke", "#1976d2").attr("stroke-width", 2);
    const ptsSel = plot.selectAll(".point").data(points, (d) => d.id).join("circle").attr("class", "point");

    // Draw helper (works with zoomed scales)
    const draw = (xS, yS) => {
      currentScalesRef.current = { xScale: xS, yScale: yS };

      // Grids
      gridX
        .call(d3.axisBottom(xS).tickSize(-innerHeight).tickFormat("").ticks(6))
        .selectAll("line")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.2);
      gridY
        .call(d3.axisLeft(yS).tickSize(-innerWidth).tickFormat("").ticks(6))
        .selectAll("line")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.2);

      // Axes
      axX.call(d3.axisBottom(xS).ticks(6).tickFormat(xFmt));
      axY.call(d3.axisLeft(yS).ticks(6).tickFormat(yFmt));

      // Line
      if (sortedPoints.length > 1) {
        const line = d3
          .line()
          .x((d) => xS(d.x))
          .y((d) => yS(d.y))
          .curve(d3.curveLinear);
        path.datum(sortedPoints).attr("d", line);
      } else {
        path.attr("d", null);
      }

      // Points
      ptsSel
        .data(points, (d) => d.id)
        .join(
          (enter) =>
            enter
              .append("circle")
              .attr("class", "point")
              .attr("cx", (d) => xS(d.x))
              .attr("cy", (d) => yS(d.y))
              .attr("r", 0)
              .style("fill", (d) => (highlightedPoint === d.id ? "#ff5722" : "#1976d2"))
              .style("opacity", (d) => (highlightedPoint ? (highlightedPoint === d.id ? 1 : 0.35) : 1))
              .style("stroke", "white")
              .style("stroke-width", 2)
              .style("cursor", "grab")
              .call((s) => s.transition().duration(150).attr("r", (d) => (highlightedPoint === d.id ? 8 : 6))),
          (update) =>
            update
              .attr("cx", (d) => xS(d.x))
              .attr("cy", (d) => yS(d.y))
              .attr("r", (d) => (highlightedPoint === d.id ? 8 : 6))
              .style("fill", (d) => (highlightedPoint === d.id ? "#ff5722" : "#1976d2"))
              .style("opacity", (d) => (highlightedPoint ? (highlightedPoint === d.id ? 1 : 0.35) : 1))
              .each(function (d) {
                if (highlightedPoint === d.id) d3.select(this).raise();
              }),
          (exit) => exit.call((s) => s.transition().duration(150).attr("r", 0).remove())
        );
    };

    // Initial draw using last zoom transform (if any)
    const xInitial = zoomTransformRef.current.rescaleX(baseScales.xScale);
    const yInitial = zoomTransformRef.current.rescaleY(baseScales.yScale);
    draw(xInitial, yInitial);

    // Tooltip (per-instance)
    let tooltipDiv = d3.select(`body`).select(`div[data-graph-tt="${tooltipIdRef.current}"]`);
    if (tooltipDiv.empty()) {
      tooltipDiv = d3
        .select("body")
        .append("div")
        .attr("data-graph-tt", tooltipIdRef.current)
        .style("position", "absolute")
        .style("padding", "10px")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-size", "12px")
        .style("z-index", 1000);
    }

    // Hover + click
    plot
      .selectAll(".point")
      .on("mouseover", function (event, d) {
        if (!isDraggingRef.current) {
          d3.select(this).transition().duration(100).attr("r", 8);
          tooltipDiv
            .style("opacity", 1)
            .html(`X: ${xFmt(d.x)}<br/>Y: ${yFmt(d.y)}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
          onPointHover?.(d.id);
        }
      })
      .on("mouseout", function () {
        if (!isDraggingRef.current) {
          d3.select(this).transition().duration(100).attr("r", 6);
          tooltipDiv.style("opacity", 0);
          onPointHover?.(null);
        }
      })
      .on("click", function (event, d) {
        if (isDraggingRef.current) return;
        event.stopPropagation();
        onPointClick?.(d);
      });

    // Drag behavior (coordinates clamped to plot area)
    const drag = d3
      .drag()
      .on("start", function (event, d) {
        isDraggingRef.current = true;
        d3.select(this).raise().attr("r", 8).style("cursor", "grabbing");
        svg.style("cursor", "grabbing");
        const [mx, my] = d3.pointer(event, g.node());
        dragStartRef.current = { x: mx, y: my };
      })
      .on("drag", function (event, d) {
        const [mxRaw, myRaw] = d3.pointer(event, g.node());
        const mx = clamp(mxRaw, 0, innerWidth);
        const my = clamp(myRaw, 0, innerHeight);
        const { xScale, yScale } = currentScalesRef.current || baseScales;
        const newX = xScale.invert(mx);
        const newY = yScale.invert(my);

        d3.select(this).attr("cx", mx).attr("cy", my);
        tooltipDiv
          .style("opacity", 1)
          .html(`X: ${xFmt(newX)}<br/>Y: ${yFmt(newY)}`)
          .style("left", event.sourceEvent.pageX + 10 + "px")
          .style("top", event.sourceEvent.pageY - 28 + "px");

        debouncedUpdateRef.current(d.id, newX, newY, points, (np) => onPointsChange?.(np));
      })
      .on("end", function (event, d) {
        const [mxRaw, myRaw] = d3.pointer(event, g.node());
        const mx = clamp(mxRaw, 0, innerWidth);
        const my = clamp(myRaw, 0, innerHeight);
        const { xScale, yScale } = currentScalesRef.current || baseScales;
        const finalX = xScale.invert(mx);
        const finalY = yScale.invert(my);

        tooltipDiv.style("opacity", 0);
        d3.select(this).transition().duration(100).attr("r", 6).style("cursor", "grab");
        svg.style("cursor", "grab");

        onPointsChange?.(points.map((p) => (p.id === d.id ? { ...p, x: finalX, y: finalY } : p)));

        const start = dragStartRef.current;
        isDraggingRef.current = false;
        if (start) {
          const dx = mx - start.x;
          const dy = my - start.y;
          if (dx * dx + dy * dy < 4) onPointClick?.(d);
        }
        dragStartRef.current = null;
      });

    plot.selectAll(".point").call(drag);

    // ---- ZOOM & PAN ----
    const zoomed = (event) => {
      zoomTransformRef.current = event.transform;
      const xS = event.transform.rescaleX(baseScales.xScale);
      const yS = event.transform.rescaleY(baseScales.yScale);
      draw(xS, yS);
    };

    const zoom = d3
      .zoom()
      .filter((event) => event.type !== "dblclick") // reserve dblclick for "add"
      .scaleExtent(zoomScaleExtent)
      .translateExtent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("start", () => svg.style("cursor", "grabbing"))
      .on("zoom", zoomed)
      .on("end", () => svg.style("cursor", "grab"));

    zoomRef.current = zoom;

    svg.call(zoom).on("dblclick.zoom", null); // kill default dblclick-zoom

    // Helper: add a point using current (zoomed) scales, clamped to plot
    const addAtMouse = (mx, my) => {
      const { xScale, yScale } = currentScalesRef.current || baseScales;
      if (!onPointsChange) return;
      const cx = clamp(mx, 0, innerWidth);
      const cy = clamp(my, 0, innerHeight);
      const x = xScale.invert(cx);
      const y = yScale.invert(cy);
      const newPoint = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), x, y };
      onPointsChange([...points, newPoint]);
    };

    // Desktop double-click to add
    const handleDoubleClick = (event) => {
      const [mx, my] = d3.pointer(event, g.node());
      addAtMouse(mx, my);
    };
    svg.on("dblclick", handleDoubleClick);

    // Touch double-tap to add
    const handlePointerDown = (event) => {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
      const [mx, my] = d3.pointer(event, g.node());
      const now = Date.now();
      const prev = lastTapRef.current;
      const dt = now - prev.t;
      const dx = mx - prev.x;
      const dy = my - prev.y;

      if (dt < 300 && dx * dx + dy * dy < 64) {
        addAtMouse(mx, my);
        lastTapRef.current = { t: 0, x: 0, y: 0 };
      } else {
        lastTapRef.current = { t: now, x: mx, y: my };
      }
    };
    svg.on("pointerdown", handlePointerDown);

    // Cleanup
    return () => {
      svg.on(".zoom", null).on("dblclick", null).on("pointerdown", null);
      d3.select(`div[data-graph-tt="${tooltipIdRef.current}"]`).remove();
    };
  }, [
    points,
    highlightedPoint,
    sortedPoints,
    baseScales,
    dimensions,
    margin,
    onPointsChange,
    onPointHover,
    onPointClick,
    xTickFormat,
    yTickFormat,
    zoomScaleExtent,
    scaleMode,
    logThreshold,
  ]);

  // AUTO-PAN TO HIGHLIGHTED POINT
  useEffect(() => {
    if (!highlightedPoint || !zoomRef.current || !svgRef.current) return;

    // find the point we want to bring into view
    const p = points.find((pt) => pt.id === highlightedPoint);
    if (!p) return;

    const { innerWidth, innerHeight } = dimensions;
    const t = zoomTransformRef.current;       // current zoom/pan
    const k = t.k;                            // current zoom level

    // Get the base (unzoomed) pixel coordinates of the point
    const px0 = baseScales.xScale(p.x);
    const py0 = baseScales.yScale(p.y);
    
    // Apply current transform to see where it is on screen
    const sx = t.applyX(px0);
    const sy = t.applyY(py0);

    // Check if already visible (with padding)
    const pad = 20;
    const inView =
      sx >= pad && sx <= innerWidth - pad &&
      sy >= pad && sy <= innerHeight - pad;
    
    if (inView) return; // Already visible, no need to pan

    // Calculate new translation to center the point (keeping same zoom level)
    const tx = innerWidth / 2 - k * px0;
    const ty = innerHeight / 2 - k * py0;
    const next = d3.zoomIdentity.translate(tx, ty).scale(k);

    // Store the new transform before applying
    zoomTransformRef.current = next;

    // Apply the transform with animation
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.transform, next);
  }, [highlightedPoint, points, baseScales, dimensions]);

  return (
    <Paper elevation={3} sx={{ p: 2, height: "100%", position: "relative" }}>
      <Box sx={{ textAlign: "center", mb: 1 }}>
        <strong>Interactive Graph</strong>
        <Box sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          Scroll to zoom • Drag to pan • Double-click/tap to add • Drag points to move • Click to edit
        </Box>
      </Box>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        // touchAction none so d3 can handle pan/zoom gestures on touch
        style={{ display: "block", margin: "0 auto", touchAction: "none" }}
      />
      
      {points.length === 0 && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <Box sx={{ fontSize: "1.2rem", mb: 1 }}>No points yet</Box>
          <Box sx={{ fontSize: "0.9rem" }}>Double-click/tap anywhere to start</Box>
        </Box>
      )}
    </Paper>
  );
});

export default Graph;