import React, { useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { Paper, Box } from "@mui/material";
import { usePoints } from "../../hooks/usePoints";
import { useRecoilValue } from "recoil";
import { sortedPointsSelector } from "../../store/atoms";
import debounce from "lodash.debounce";

const Graph = ({
  width = 800,
  height = 500,
  margin = { top: 20, right: 30, bottom: 40, left: 50 },
}) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastRenderRef = useRef(0);

  const {
    points,
    highlightedPoint,
    boundingBox,
    addPoint,
    updatePoint,
    highlightPoint,
    clearHighlight,
    startEditingPoint,
  } = usePoints();

  const sortedPoints = useRecoilValue(sortedPointsSelector);

  // Dimensions inside axes
  const dimensions = useMemo(
    () => ({
      innerWidth: width - margin.left - margin.right,
      innerHeight: height - margin.top - margin.bottom,
    }),
    [width, height, margin]
  );

  // Scales
  const scales = useMemo(() => {
    const xScale = d3
      .scaleLinear()
      .domain([boundingBox.minX, boundingBox.maxX])
      .range([0, dimensions.innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([boundingBox.minY, boundingBox.maxY])
      .range([dimensions.innerHeight, 0]);

    return { xScale, yScale };
  }, [boundingBox, dimensions]);

  // Debounced update for smooth dragging (~60fps)
  const debouncedUpdate = useMemo(
    () =>
      debounce((id, x, y) => {
        updatePoint(id, x, y);
      }, 16),
    [updatePoint]
  );

  useEffect(() => () => debouncedUpdate.cancel(), [debouncedUpdate]);

  // Double-click to add a point
  const handleDoubleClick = useCallback(
    (event) => {
      event.preventDefault();
      const svg = d3.select(svgRef.current);
      const g = svg.select(".main-group");
      const [mouseX, mouseY] = d3.pointer(event, g.node());
      const x = scales.xScale.invert(mouseX);
      const y = scales.yScale.invert(mouseY);

      if (
        mouseX >= 0 &&
        mouseX <= dimensions.innerWidth &&
        mouseY >= 0 &&
        mouseY <= dimensions.innerHeight
      ) {
        addPoint(x, y);
      }
    },
    [scales, dimensions, addPoint]
  );

  useEffect(() => {
    // avoid full redraw during drag (we move the element directly)
    if (isDraggingRef.current) return;
    if (!svgRef.current) return;

    // throttle heavy redraws
    const now = Date.now();
    if (now - lastRenderRef.current < 16) return;
    lastRenderRef.current = now;

    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll("*").remove();

    // Main group with margins applied
    const g = svg
      .append("g")
      .attr("class", "main-group")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const { xScale, yScale } = scales;
    const { innerWidth, innerHeight } = dimensions;

    // Grid
    const xGrid = d3
      .axisBottom(xScale)
      .tickSize(-innerHeight)
      .tickFormat("")
      .ticks(10);
    const yGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat("")
      .ticks(10);

    g.append("g")
      .attr("class", "grid x-grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xGrid)
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.2);

    g.append("g")
      .attr("class", "grid y-grid")
      .call(yGrid)
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.2);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(10);

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 35)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("X Axis");

    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -innerHeight / 2)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("Y Axis");

    // Polyline
    if (sortedPoints.length > 1) {
      const line = d3
        .line()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(d3.curveLinear);

      g.append("path")
        .datum(sortedPoints)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "#1976d2")
        .attr("stroke-width", 2)
        .attr("d", line);
    }

    // Tooltip
    let tooltipDiv = d3.select("body").select(".graph-tooltip");
    if (tooltipDiv.empty()) {
      tooltipDiv = d3
        .select("body")
        .append("div")
        .attr("class", "graph-tooltip")
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

    // Points (enter/update apply highlight styles)
    const pointsGroup = g
      .selectAll(".point")
      .data(points, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", "point")
            .attr("cx", (d) => xScale(d.x))
            .attr("cy", (d) => yScale(d.y))
            .attr("r", 0)
            .style("fill", (d) =>
              highlightedPoint === d.id ? "#ff5722" : "#1976d2"
            )
            .style("opacity", (d) =>
              highlightedPoint ? (highlightedPoint === d.id ? 1 : 0.35) : 1
            )
            .style("stroke", "white")
            .style("stroke-width", 2)
            .style("cursor", "move")
            .call((s) =>
              s
                .transition()
                .duration(150)
                .attr("r", (d) => (highlightedPoint === d.id ? 8 : 6))
            ),
        (update) =>
          update
            .attr("cx", (d) => xScale(d.x))
            .attr("cy", (d) => yScale(d.y))
            .attr("r", (d) => (highlightedPoint === d.id ? 8 : 6))
            .style("fill", (d) =>
              highlightedPoint === d.id ? "#ff5722" : "#1976d2"
            )
            .style("opacity", (d) =>
              highlightedPoint ? (highlightedPoint === d.id ? 1 : 0.35) : 1
            )
            .each(function (d) {
              if (highlightedPoint === d.id) d3.select(this).raise();
            }),
        (exit) =>
          exit.call((s) => s.transition().duration(150).attr("r", 0).remove())
      );

    // Hover + click handlers
    pointsGroup
      .on("mouseover", function (event, d) {
        if (!isDraggingRef.current) {
          d3.select(this).transition().duration(100).attr("r", 8);
          tooltipDiv
            .style("opacity", 1)
            .html(`X: ${d.x.toFixed(2)}<br/>Y: ${d.y.toFixed(2)}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
          highlightPoint(d.id);
        }
      })
      .on("mouseout", function () {
        if (!isDraggingRef.current) {
          d3.select(this).transition().duration(100).attr("r", 6);
          tooltipDiv.style("opacity", 0);
          clearHighlight();
        }
      })
      .on("click", function (event, d) {
        event.stopPropagation();
        startEditingPoint(d);
      });

    // Drag behavior (use pointer relative to <g>)
    const drag = d3
      .drag()
      .on("start", function () {
        isDraggingRef.current = true;
        d3.select(this).raise().attr("r", 8);
      })
      .on("drag", function (event, d) {
        const [mx, my] = d3.pointer(event, g.node());
        const newX = xScale.invert(mx);
        const newY = yScale.invert(my);

        // immediate visual update
        d3.select(this).attr("cx", mx).attr("cy", my);

        // tooltip
        tooltipDiv
          .style("opacity", 1)
          .html(`X: ${newX.toFixed(2)}<br/>Y: ${newY.toFixed(2)}`)
          .style("left", event.sourceEvent.pageX + 10 + "px")
          .style("top", event.sourceEvent.pageY - 28 + "px");

        // debounced state update
        debouncedUpdate(d.id, newX, newY);
      })
      .on("end", function (event, d) {
        isDraggingRef.current = false;
        d3.select(this).transition().duration(100).attr("r", 6);
        tooltipDiv.style("opacity", 0);

        // final precise commit (non-debounced)
        const [mx, my] = d3.pointer(event, g.node());
        updatePoint(d.id, xScale.invert(mx), yScale.invert(my));
      });

    pointsGroup.call(drag);

    // Double-click to add
    svg.on("dblclick", handleDoubleClick);

    // Cleanup tooltip on unmount/redraw
    return () => {
      if (tooltipRef.current) {
        tooltipDiv.remove();
      }
    };
  }, [
    points,
    highlightedPoint,
    scales,
    dimensions,
    sortedPoints,
    margin,
    debouncedUpdate,
    highlightPoint,
    clearHighlight,
    startEditingPoint,
    handleDoubleClick,
  ]);

  return (
    <Paper elevation={3} sx={{ p: 2, height: "100%", position: "relative" }}>
      <Box sx={{ textAlign: "center", mb: 1 }}>
        <strong>Interactive Graph</strong>
        <Box sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          Double-click to add point • Drag points to move • Click point to edit
        </Box>
      </Box>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: "block", margin: "0 auto" }}
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
          <Box sx={{ fontSize: "0.9rem" }}>Double-click anywhere to start</Box>
        </Box>
      )}
    </Paper>
  );
};

export default Graph;
