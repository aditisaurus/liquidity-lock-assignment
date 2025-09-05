import React, { useEffect, useRef, useMemo, useCallback, useState } from "react";
import * as d3 from "d3";
import debounce from "lodash.debounce";
import { Typography } from "@mui/material";

import {
  ANIMATION_TIMING,
  INTERACTION_THRESHOLDS,
  DEFAULT_CONFIG, DRAG_CLICK_THRESHOLD
} from "../../constants/graphConstants";

import {
  formatters,
  mathUtils,
  idUtils,
} from "../../utils/graphUtils";

const { formatSI } = formatters;
const { clamp } = mathUtils;
const { generateId } = idUtils;



const Graph = React.memo(function Graph({
  points = [],
  highlightedPoint = null,
  onPointsChange,
  onPointHover,
  onPointClick,
  width = DEFAULT_CONFIG.DIMENSIONS.width,
  height = DEFAULT_CONFIG.DIMENSIONS.height,
  margin = DEFAULT_CONFIG.MARGINS,
  scaleMode = "auto",
  xTickFormat,
  yTickFormat,
  logThreshold = DEFAULT_CONFIG.LOG_THRESHOLD,
  zoomScaleExtent = DEFAULT_CONFIG.ZOOM_EXTENT,
}) {
  const svgRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const zoomTransformRef = useRef(d3.zoomIdentity);
  const currentScalesRef = useRef({ xScale: null, yScale: null });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const lastTapRef = useRef({ t: 0, x: 0, y: 0 });

  const wrapperRef = useRef(null);
const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

useEffect(() => {
  if (!wrapperRef.current) return;
  const resizeObserver = new ResizeObserver(([entry]) => {
    setContainerSize({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    });
  });
  resizeObserver.observe(wrapperRef.current);
  return () => resizeObserver.disconnect();
}, []);


  const elementIdsRef = useRef({
    clip: `clip-${Math.random().toString(36).slice(2)}`,
    tooltip: `tt-${Math.random().toString(36).slice(2)}`,
  });

  const xFormatter = useMemo(() => xTickFormat || formatSI, [xTickFormat]);
  const yFormatter = useMemo(() => yTickFormat || formatSI, [yTickFormat]);

  const sortedPoints = useMemo(() => [...points].sort((a, b) => a.x - b.x), [points]);

const dimensions = useMemo(
  () => ({
    innerWidth: containerSize.width - margin.left - margin.right,
    innerHeight: containerSize.height - margin.top - margin.bottom,
  }),
  [containerSize, margin]
);



  // Debounced update for smoother drag
  const debouncedUpdate = useMemo(
    () =>
      debounce((id, x, y, prevPoints, callback) => {
        callback(prevPoints.map((p) => (p.id === id ? { ...p, x, y } : p)));
      }, INTERACTION_THRESHOLDS.DEBOUNCE_DELAY),
    []
  );

  // Optimized draw function
  const draw = useCallback(
    (xScale, yScale, g, sortedPoints, dimensions) => {
      const { innerWidth, innerHeight } = dimensions;
      currentScalesRef.current = { xScale, yScale };

      // Update grids
      g.select(".x-grid")
        .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat("").ticks(6));

      g.select(".y-grid")
        .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat("").ticks(6));

      // Update axes
      g.select(".x-axis").call(d3.axisBottom(xScale).ticks(6).tickFormat(xFormatter));
      g.select(".y-axis").call(d3.axisLeft(yScale).ticks(6).tickFormat(yFormatter));

      // Update line
      const path = g.select(".line-path");
      if (sortedPoints.length > 1) {
        const line = d3
          .line()
          .x((d) => xScale(d.x))
          .y((d) => yScale(d.y))
          .curve(d3.curveLinear);
        path.datum(sortedPoints).attr("d", line);
      } else {
        path.attr("d", null);
      }

      // Update points
      const pointsSelection = g
        .select(".plot-area")
        .selectAll(".point")
        .data(points, (d) => d.id);

      pointsSelection.exit().transition().duration(ANIMATION_TIMING).attr("r", 0).remove();

      const entering = pointsSelection
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 0)
        .style("fill", "#1976d2")
        .style("stroke", "white")
        .style("stroke-width", 2)
        .style("cursor", "grab");

      pointsSelection
        .merge(entering)
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .transition()
        .duration(ANIMATION_TIMING)
        .attr("r", 6);
    },
    [points, xFormatter, yFormatter]
  );

  // Main setup effect
  useEffect(() => {
    if (!svgRef.current) return;

    const { innerWidth, innerHeight } = dimensions;
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove();
    svg.style("cursor", "grab");

    const g = svg
      .append("g")
      .attr("class", "main-group")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Clip path
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", elementIdsRef.current.clip)
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    // Grids
    g.append("g")
      .attr("class", "grid x-grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .style("opacity", 0.2);

    g.append("g").attr("class", "grid y-grid").style("opacity", 0.2);

    // Axes
    const xAxis = g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`);

    const yAxis = g.append("g").attr("class", "y-axis");

    // Labels
    xAxis
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 35)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("X Axis");

    yAxis
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -innerHeight / 2)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("Y Axis");

    // Plot area
    const plot = g
      .append("g")
      .attr("class", "plot-area")
      .attr("clip-path", `url(#${elementIdsRef.current.clip})`);

    // Line path
    plot
      .append("path")
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", "#1976d2")
      .attr("stroke-width", 2);

    // Tooltip
    let tooltip = d3
      .select("body")
      .select(`[data-tooltip-id="${elementIdsRef.current.tooltip}"]`);

    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append("div")
        .attr("data-tooltip-id", elementIdsRef.current.tooltip)
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

    // Zoom
    const zoom = d3
      .zoom()
      .filter((event) => event.type !== "dblclick")
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
      .on("zoom", (event) => {
        zoomTransformRef.current = event.transform;
        const xScale = event.transform.rescaleX(
          d3.scaleLinear().domain(d3.extent(points, (d) => d.x)).range([0, innerWidth])
        );
        const yScale = event.transform.rescaleY(
          d3.scaleLinear().domain(d3.extent(points, (d) => d.y)).range([innerHeight, 0])
        );
        draw(xScale, yScale, g, sortedPoints, dimensions);
      })
      .on("end", () => svg.style("cursor", "grab"));

    zoomBehaviorRef.current = zoom;
    svg.call(zoom).on("dblclick.zoom", null);

    // Initial draw
    const xInitial = zoomTransformRef.current.rescaleX(
      d3.scaleLinear().domain(d3.extent(points, (d) => d.x)).range([0, innerWidth])
    );
    const yInitial = zoomTransformRef.current.rescaleY(
      d3.scaleLinear().domain(d3.extent(points, (d) => d.y)).range([innerHeight, 0])
    );
    draw(xInitial, yInitial, g, sortedPoints, dimensions);

    // Drag behavior
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
        const { xScale, yScale } = currentScalesRef.current;
        const newX = xScale.invert(mx);
        const newY = yScale.invert(my);

        d3.select(this).attr("cx", mx).attr("cy", my);
        tooltip
          .style("opacity", 1)
          .html(`X: ${xFormatter(newX)}<br/>Y: ${yFormatter(newY)}`)
          .style("left", event.sourceEvent.pageX + 10 + "px")
          .style("top", event.sourceEvent.pageY - 28 + "px");

        debouncedUpdate(d.id, newX, newY, points, onPointsChange);
      })
      .on("end", function (event, d) {
        const [mxRaw, myRaw] = d3.pointer(event, g.node());
        const mx = clamp(mxRaw, 0, innerWidth);
        const my = clamp(myRaw, 0, innerHeight);
        const { xScale, yScale } = currentScalesRef.current;

        tooltip.style("opacity", 0);
        d3.select(this).transition().duration(100).attr("r", 6).style("cursor", "grab");
        svg.style("cursor", "grab");

        onPointsChange?.(
          points.map((p) =>
            p.id === d.id ? { ...p, x: xScale.invert(mx), y: yScale.invert(my) } : p
          )
        );

        // ✅ Detect click vs drag
        const start = dragStartRef.current;
        isDraggingRef.current = false;
        if (start) {
          const dx = mx - start.x;
          const dy = my - start.y;
          if (dx * dx + dy * dy < DRAG_CLICK_THRESHOLD) {
            onPointClick?.(d);
          }
        }
        dragStartRef.current = null;
      });

    // Apply drag + hover
  plot
  .selectAll(".point")
  .call(drag)
  .on("mouseover", function (event, d) {
    if (!isDraggingRef.current) {
      d3.select(this).transition().duration(100).attr("r", 8);
      tooltip
        .style("opacity", 1)
        .html(`X: ${xFormatter(d.x)}<br/>Y: ${yFormatter(d.y)}`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
      onPointHover?.(d.id);
    }
  })
  .on("mouseout", function () {
    if (!isDraggingRef.current) {
      d3.select(this).transition().duration(100).attr("r", 6);
      tooltip.style("opacity", 0);
      onPointHover?.(null);
    }
  })
  .on("click", function (event, d) {
    if (!isDraggingRef.current) {
      event.stopPropagation();
      onPointClick?.(d);  
    }
  });

    // Add point on double-click/tap
    const addPoint = (mx, my) => {
      const { xScale, yScale } = currentScalesRef.current;
      if (!onPointsChange) return;
      const cx = clamp(mx, 0, innerWidth);
      const cy = clamp(my, 0, innerHeight);
      const newPoint = { id: generateId(), x: xScale.invert(cx), y: yScale.invert(cy) };
      onPointsChange([...points, newPoint]);
    };

    svg.on("dblclick", (event) => {
      const [mx, my] = d3.pointer(event, g.node());
      addPoint(mx, my);
    });

    return () => {
      svg.on(".zoom", null).on("dblclick", null).on("pointerdown", null);
      debouncedUpdate.cancel();
      tooltip.remove();
    };
  }, [points, sortedPoints, dimensions, margin, onPointsChange, onPointHover, onPointClick, zoomScaleExtent, draw, debouncedUpdate]);

  // Highlight effect
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const plot = svg.select(".plot-area");
    if (plot.empty()) return;

    plot
      .selectAll(".point")
      .transition()
      .duration(ANIMATION_TIMING)
      .attr("r", (d) => (highlightedPoint === d.id ? 8 : 6))
      .style("fill", (d) => (highlightedPoint === d.id ? "#ff5722" : "#1976d2"))
      .style("opacity", (d) =>
        highlightedPoint ? (highlightedPoint === d.id ? 1 : 0.35) : 1
      );

    if (highlightedPoint) {
      plot.selectAll(".point").filter((d) => d.id === highlightedPoint).raise();
    }
  }, [highlightedPoint]);

return (
<div ref={wrapperRef} className="relative h-full w-full">

    {/* Header */}


    {/* SVG */}
  <svg
  ref={svgRef}
  className="w-full h-full select-none touch-none"
  preserveAspectRatio="xMinYMin meet"
/>


    {/* Empty state */}
    {points.length === 0 && (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
        <p className="mb-1 text-lg">No points yet</p>
        <p className="text-sm">Double-click/tap anywhere to start</p>
      </div>
    )}
  </div>
);

});

export default Graph;
