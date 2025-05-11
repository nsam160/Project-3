import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const state = {
  mouse1: '1',
  days1: [1, 5, 9],
  mouse2: '2',
  days2: [2, 4],
  minute: 720
};
const visibility = {
  mouse1: true,
  mouse2: true
};

// SVG setup
const width = 500, height = 400, margin = { top: 20, right: 30, bottom: 40, left: 50 };
const svg = d3.select("#scatterplot")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const plotArea = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

  const legendGroup = svg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${width - 140}, ${margin.top})`);

const legendData = [
  { label: "Mouse 1", color: "steelblue", key: "mouse1" },
  { label: "Mouse 2", color: "orange", key: "mouse2" }
];

legendData.forEach((item, i) => {
  legendGroup.append("circle")
    .attr("cx", 0)
    .attr("cy", i * 25)
    .attr("r", 6)
    .style("fill", item.color)
    .attr("class", `legend-dot ${item.key}`)
    .style("cursor", "pointer")
    .on("click", () => {
      visibility[item.key] = !visibility[item.key];
      updateScatterplot(femaleData, state); // Ensure femaleData is passed here
    });

  legendGroup.append("text")
    .attr("x", 15)
    .attr("y", i * 25 + 5)
    .text(item.label)
    .attr("class", `legend-label ${item.key}`)
    .style("font-size", "13px")
    .style("cursor", "pointer")
    .attr("alignment-baseline", "middle")
    .on("click", () => {
      visibility[item.key] = !visibility[item.key];
      updateScatterplot(femaleData, state); // Ensure femaleData is passed here
    });
});

const xScale = d3.scaleLinear().range([0, width - margin.left - margin.right]);
const yScale = d3.scaleLinear().range([height - margin.top - margin.bottom, 0]);

plotArea.append("g").attr("class", "x-axis")
  .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`);

plotArea.append("g").attr("class", "y-axis");

// Load and process data
d3.csv("mouse.csv", row => ({
  Temp: +row.Temp,
  Act: +row.Act,
  id: row.id,
  minutes: +row.minutes,
  days: +row.days,
  gender: row.gender
})).then(data => {
  const femaleData = data.filter(d => d.gender === "female");

  ////DEBUGGING
    console.log("Sample rows:", data.slice(0, 5));
    console.log("Unique IDs:", Array.from(new Set(data.map(d => d.id))));
    console.log("Unique Days:", Array.from(new Set(data.map(d => d.days))));
    console.log("Minute Range:", d3.extent(data, d => +d.minutes));
    console.log("Gender counts:", d3.rollup(data, v => v.length, d => d.gender));

  // Lock x/y scale to full data range
  xScale.domain(d3.extent(femaleData, d => d.Temp)).nice();
  yScale.domain(d3.extent(femaleData, d => d.Act)).nice();
  
  plotArea.select(".x-axis").call(d3.axisBottom(xScale));

  svg.append("text")
    .attr("class", "x axis-label")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + (width - margin.left - margin.right) / 2)
    .attr("y", height - 5)
    .text("Temperature (°C)");

  plotArea.select(".y-axis").call(d3.axisLeft(yScale));
    svg.append("text")
    .attr("class", "y axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 2))
    .attr("y", 15)
    .text("Activity Level");

  // Populate dropdowns
  const mouseIDs = Array.from(new Set(femaleData.map(d => +d.id))) // convert to numbers
    .sort((a, b) => a - b)  // sort numerically
    .map(d => d.toString()); // convert back to strings for matching `id`

  d3.select("#mouse1").selectAll("option")
    .data(mouseIDs)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => `Mouse ${d}`);
  d3.select("#mouse1").property("value", state.mouse1);

  d3.select("#mouse2").selectAll("option")
    .data(mouseIDs)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => `Mouse ${d}`);
  d3.select("#mouse2").property("value", state.mouse2);

  // Multi-day selectors
  function populateDaySelect(selectId, selectedDays, updateKey) {
    const select = d3.select(selectId);
    select.selectAll("*").remove();
    for (let i = 0; i <= 13; i++) {
      select.append("option")
        .attr("value", i)
        .text(`Day ${i}`)
        .property("selected", selectedDays.includes(i));
    }
    select.on("change", function () {
      state[updateKey] = Array.from(this.selectedOptions).map(o => +o.value);
      updateScatterplot(femaleData, state);
    });
  }

  populateDaySelect("#days1Select", state.days1, "days1");
  populateDaySelect("#days2Select", state.days2, "days2");

  // Dropdown listeners
  d3.select("#mouse1").on("change", function () {
    state.mouse1 = this.value;
    updateScatterplot(femaleData, state);
  });

  d3.select("#mouse2").on("change", function () {
    state.mouse2 = this.value;
    updateScatterplot(femaleData, state);
  });

  d3.select("#minuteSlider").on("input", function () {
    state.minute = +this.value;
    d3.select("#minuteLabel").text(this.value);
    updateScatterplot(femaleData, state);
  });

  updateScatterplot(femaleData, state);
});

function updateScatterplot(data, state) {
  const group1 = visibility.mouse1
  ? data.filter(d =>
      d.id === state.mouse1 &&
      state.days1.includes(+d.days) &&
      +d.minutes === +state.minute
    )
  : [];

  const group2 = visibility.mouse2
    ? data.filter(d =>
        d.id === state.mouse2 &&
        state.days2.includes(+d.days) &&
        +d.minutes === +state.minute
        )
    : [];

  const combined = [
    ...group1.map(d => ({ ...d, group: 'A' })),
    ...group2.map(d => ({ ...d, group: 'B' }))
  ];

    // Update legend appearance
    d3.selectAll(".legend-label.mouse1").style("fill", visibility.mouse1 ? "black" : "#aaa");
    d3.selectAll(".legend-label.mouse2").style("fill", visibility.mouse2 ? "black" : "#aaa");

    d3.selectAll(".legend-dot.mouse1").style("fill", visibility.mouse1 ? "steelblue" : "#ddd");
    d3.selectAll(".legend-dot.mouse2").style("fill", visibility.mouse2 ? "orange" : "#ddd");


  const dots = plotArea.selectAll("circle").data(combined, d => `${d.id}-${d.days}-${d.minutes}`);

dots.enter()
  .append("circle")
  .attr("r", 5)
  .attr("cx", d => xScale(d.Temp))
  .attr("cy", d => yScale(d.Act))
  .attr("fill", d => d.group === 'A' ? 'steelblue' : 'orange')
  .on("mouseover", function (event, d) {
    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip.html(`
      <strong>Mouse:</strong> ${d.id}<br>
      <strong>Day:</strong> ${d.days}<br>
      <strong>Temp:</strong> ${d.Temp} °C<br>
      <strong>Activity:</strong> ${d.Act}
    `)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
  })
  .on("mousemove", function (event) {
    tooltip.style("left", (event.pageX + 10) + "px")
           .style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", function () {
    tooltip.transition().duration(300).style("opacity", 0);
  })
  .merge(dots)
  .transition()
  .duration(300)
  .attr("cx", d => xScale(d.Temp))
  .attr("cy", d => yScale(d.Act));

  dots.exit().remove();
}
