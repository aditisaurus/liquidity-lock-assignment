// src/components/Graph/Graph.jsx
import React, { useEffect, useRef, useMemo, useCallback, useState } from "react";
import * as d3 from "d3";
import debounce from "lodash.debounce";

import {
  ANIMATION_TIMING,
  INTERACTION_THRESHOLDS,
  DEFAULT_CONFIG,
} from "../../constants/graphConstants";

import { formatters, mathUtils, idUtils } from "../../utils/graphUtils";

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
  xTickFormat,
  yTickFormat,
  zoomScaleExtent = DEFAULT_CONFIG.ZOOM_EXTENT,
}) {
  const svgRef = useRef(null);
  const zoomTransformRef = useRef(d3.zoomIdentity);
  const currentScalesRef = useRef({ xScale: null, yScale: null });

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
  });

  const xFormatter = useMemo(() => xTickFormat || formatSI, [xTickFormat]);
  const yFormatter = useMemo(() => yTickFormat || formatSI, [yTickFormat]);

  const sortedPoints = useMemo(
    () => [...points].sort((a, b) => a.x - b.x),
    [points]
  );

  const dimensions = useMemo(
    () => ({
      innerWidth: containerSize.width - margin.left - margin.right,
      innerHeight: containerSize.height - margin.top - margin.bottom,
    }),
    [containerSize, margin]
  );

  const getSafeDomain = (domain, fallback = [0, 100]) =>
    !domain || domain.some((d) => isNaN(d)) || domain[0] === domain[1]
      ? fallback
      : domain;

  const draw = useCallback(
    (xScale, yScale, g, sortedPoints, dimensions) => {
      const { innerWidth, innerHeight } = dimensions;
      currentScalesRef.current = { xScale, yScale };

      // grids
      g.select(".x-grid").call(
        d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat("").ticks(6)
      );
      g.select(".y-grid").call(
        d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat("").ticks(6)
      );

      // axes
      g.select(".x-axis").call(
        d3.axisBottom(xScale).ticks(6).tickFormat(xFormatter)
      );
      g.select(".y-axis").call(
        d3.axisLeft(yScale).ticks(6).tickFormat(yFormatter)
      );

      // line
      const path = g.select(".line-path");
      if (sortedPoints.length > 1) {
        const line = d3
          .line()
          .x((d) => xScale(d.x))
          .y((d) => yScale(d.y));
        path.datum(sortedPoints).attr("d", line);
      } else {
        path.attr("d", null);
      }

      // points
      const pointsSelection = g
        .select(".plot-area")
        .selectAll(".point")
        .data(points, (d) => d.id);

      pointsSelection.exit().remove();

      const entering = pointsSelection
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("r", 0)
        .style("fill", "#1976d2")
        .style("stroke", "white")
        .style("stroke-width", 2)
        .style("cursor", "grab");

      const merged = pointsSelection.merge(entering);

      merged
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .transition()
        .duration(ANIMATION_TIMING)
        .attr("r", 6);

      // hover + click listeners (with correct scales)
      merged
        .on("mouseover", function (event, d) {
          const { xScale, yScale } = currentScalesRef.current || {};
          if (xScale && yScale) {
            d3.select(this)
              .transition()
              .duration(100)
              .attr("r", 8)
              .attr("cx", xScale(d.x))
              .attr("cy", yScale(d.y));
          }
          onPointHover?.(d.id);
        })
        .on("mouseout", function () {
          d3.select(this).transition().duration(100).attr("r", 6);
          onPointHover?.(null);
        })
        .on("click", function (event, d) {
          event.stopPropagation();
          onPointClick?.(d);
        });
    },
    [points, xFormatter, yFormatter, onPointHover, onPointClick]
  );

  useEffect(() => {
    if (!svgRef.current) return;
    const { innerWidth, innerHeight } = dimensions;
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove();
    svg.style("cursor", "grab");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // clip
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", elementIdsRef.current.clip)
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    // grids + axes
    g.append("g")
      .attr("class", "grid x-grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .style("opacity", 0.2);
    g.append("g").attr("class", "grid y-grid").style("opacity", 0.2);
    g.append("g").attr("class", "x-axis").attr("transform", `translate(0,${innerHeight})`);
    g.append("g").attr("class", "y-axis");

    // labels
    g.select(".x-axis")
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 35)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("X Axis");

    g.select(".y-axis")
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -innerHeight / 2)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("Y Axis");

    // plot area
    const plot = g
      .append("g")
      .attr("class", "plot-area")
      .attr("clip-path", `url(#${elementIdsRef.current.clip})`);

    plot
      .append("path")
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", "#1976d2")
      .attr("stroke-width", 2);

    // initial scales
    const xDomain = getSafeDomain(d3.extent(points, (d) => d.x));
    const yDomain = getSafeDomain(d3.extent(points, (d) => d.y));

    const baseX = d3.scaleLinear().domain(xDomain).range([0, innerWidth]);
    const baseY = d3.scaleLinear().domain(yDomain).range([innerHeight, 0]);

    const xInitial = zoomTransformRef.current.rescaleX(baseX);
    const yInitial = zoomTransformRef.current.rescaleY(baseY);

    draw(xInitial, yInitial, g, sortedPoints, dimensions);

    // --- Zoom & pan ---
    const zoom = d3
      .zoom()
      .scaleExtent(zoomScaleExtent)
      .translateExtent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("zoom", (event) => {
        zoomTransformRef.current = event.transform;
        const newX = event.transform.rescaleX(baseX);
        const newY = event.transform.rescaleY(baseY);
        draw(newX, newY, g, sortedPoints, dimensions);
      });

    svg.call(zoom).on("dblclick.zoom", null); // disable default dblclick zoom

    // --- Double click to add point ---
    svg.on("dblclick", (event) => {
      const [mx, my] = d3.pointer(event, g.node());
      const cx = clamp(mx, 0, innerWidth);
      const cy = clamp(my, 0, innerHeight);

      const { xScale, yScale } = currentScalesRef.current || {
        xScale: baseX,
        yScale: baseY,
      };

      const newPoint = {
        id: generateId(),
        x: xScale.invert(cx),
        y: yScale.invert(cy),
      };

      onPointsChange?.([...points, newPoint]);
    });

    // cleanup
    return () => {
      svg.on(".zoom", null).on("dblclick", null);
    };
  }, [points, sortedPoints, dimensions, margin, draw, onPointsChange, zoomScaleExtent]);

  // highlight effect when table selects
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const plot = svg.select(".plot-area");
    if (plot.empty()) return;

    const { xScale, yScale } = currentScalesRef.current || {};

    plot
      .selectAll(".point")
      .transition()
      .duration(ANIMATION_TIMING)
      .attr("r", (d) => (highlightedPoint === d.id ? 8 : 6))
      .attr("cx", (d) => (xScale ? xScale(d.x) : d.x))
      .attr("cy", (d) => (yScale ? yScale(d.y) : d.y))
      .style("fill", (d) => (highlightedPoint === d.id ? "#ff5722" : "#1976d2"))
      .style("opacity", (d) =>
        highlightedPoint ? (highlightedPoint === d.id ? 1 : 0.35) : 1
      );

    if (highlightedPoint) {
      plot.selectAll(".point").filter((d) => d.id === highlightedPoint).raise();
    }
  }, [highlightedPoint]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full select-none touch-none"
        preserveAspectRatio="xMinYMin meet"
      />
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
