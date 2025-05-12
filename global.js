import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export const startOfDay = new Date(2000, 0, 1, 0, 0);   // 00:00
export const endOfDay = new Date(2000, 0, 1, 23, 59);   // 23:59

let svg;                     // will hold the one <svg>
let xScale, yScale;          // left panel   (Activity)
let xScale2, yScale2;        // right panel  (Temperature)
let focusGroup;              // <g> that carries the vertical line + dots
let actDot1, actDot2, tempDot1, tempDot2;  
let leftCursor, rightCursor;   // the two rulers
let map1 = [], map2 = []; 
let actLabel1, tempLabel1, actLabel2, tempLabel2; 

async function loadData() {
    const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const data = await d3.csv('female.csv', (row) => ({
        ...row,
        Temp: +row.Temp,
        Act: +row.Act,
        id: +row.id,
        minutes: +row.minutes,
        days: +row.days,
        total_minutes: +row.total_minutes,
        date: parseTime(row.date)
    }));
  
    return data;
}

function formatTime(minutes) {
    const date = new Date(2000, 0, 1, 0, minutes); // Set hours & minutes
    return date.toLocaleString('en-US', { timeStyle: 'short' }); // Format as HH:MM AM/PM
}

function filtering(data) {
    const femaleSelected = document.querySelectorAll('#mouse-selector input[type="checkbox"]');
    const femaleIds = [];
    femaleSelected.forEach(f => {
        if (f.checked){
            femaleIds.push(+f.id.slice(1));
        } 
    });

    const line1Selected = document.querySelectorAll('#pink input[type="checkbox"]');
    const line1Days = [];
    line1Selected.forEach(p => {
        if (p.checked){
            line1Days.push(+p.id.slice(1));
        }
    });
    let line1 = data.filter((row) => {
        return (femaleIds.includes(row.id)) && (line1Days.includes(row.days + 1));
    });
    let group1 = d3.rollups(
        line1, 
        (v) => ({
            avg_temp: d3.mean(v, d => d.Temp),
            avg_act: d3.mean(v, d => d.Act)
        }),
        (d) => +d.minutes
    );
    let map1 = group1.map(([groups, values]) => {
        return {
            minutes: groups,
            avg_temp: values.avg_temp,
            avg_act: values.avg_act,
            date: new Date(2000, 0, 1, 0, groups)
        }
    });

    const line2Selected = document.querySelectorAll('#green input[type="checkbox"]');
    const line2Days = [];
    line2Selected.forEach(g => {
        if (g.checked){
            line2Days.push(+g.id.slice(1));
        }
    });
    let line2 = data.filter((row) => {
        return (femaleIds.includes(row.id)) && (line2Days.includes(row.days + 1))
    });
    let group2 = d3.rollups(
        line2, 
        (v) => ({
            avg_temp: d3.mean(v, d => d.Temp),
            avg_act: d3.mean(v, d => d.Act)
        }),
        (d) => +d.minutes
    );
    let map2 = group2.map(([groups, values]) => {
        return {
            minutes: groups,
            avg_temp: values.avg_temp,
            avg_act: values.avg_act,
            date: new Date(2000, 0, 1, 0, groups)
        }
    });

    return [map1, map2];
}

function renderLinePlot(data){
    const width = 1000;
    const height = 500;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    [map1, map2] = data; 
    svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    const usableArea = {
        top: margin.top,
        right: (width / 2) - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: (width / 2) - margin.left - margin.right,
        height: (height / 2) - margin.top - margin.bottom,
    };
    xScale = d3
        .scaleTime()
        .domain([startOfDay, endOfDay])
        .range([usableArea.left, usableArea.right])
        .nice();
    yScale = d3.scaleLinear().domain([0, 70]).range([usableArea.bottom, usableArea.top]);
    svg.append("g")
        .attr("transform", `translate(0,${usableArea.bottom})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%H:%M")));
    svg.append("g")
        .attr("transform", `translate(${usableArea.left},0)`)
        .call(d3.axisLeft(yScale));
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", usableArea.left + usableArea.width / 2)
        .attr("y", height - 5)
        .text("24-Hour Time (HH:MM)");
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90)`)
        .attr("x", -height/2)
        .attr("y", 10) // To the left of the y-axis
        .text("Average Activity Level");

    const usableArea2 = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: (width / 2) + margin.left,
        width: (width / 2) - margin.left - margin.right,
        height: (height / 2) - margin.top - margin.bottom,
    };
    xScale2 = d3
        .scaleTime()
        .domain([startOfDay, endOfDay])
        .range([usableArea2.left, usableArea2.right])
        .nice();
    yScale2 = d3.scaleLinear().domain([35, 40]).range([usableArea2.bottom, usableArea2.top]);
    svg.append("g")
        .attr("transform", `translate(0,${usableArea2.bottom})`)
        .call(d3.axisBottom(xScale2).tickFormat(d3.timeFormat("%H:%M")));
    svg.append("g")
        .attr("transform", `translate(${usableArea2.left},0)`)
        .call(d3.axisLeft(yScale2));
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", usableArea2.left + usableArea2.width / 2)
        .attr("y", height - 5)
        .text("24-Hour Time (HH:MM)");
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90)`)
        .attr("x", -height/2)
        .attr("y", 5 + width/2) 
        .text("Average Temperature");
    
    const lineAct = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.avg_act));
    const lineTemp = d3.line()
        .x(d => xScale2(d.date))
        .y(d => yScale2(d.avg_temp));
    
    if (data[0].length !== 0){
        svg.append("path")
            .datum(data[0])
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", 'pink')
            .attr("stroke-width", 2)
            .attr("d", lineAct);
        svg.append("path")
            .datum(data[0])
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", 'pink')
            .attr("stroke-width", 2)
            .attr("d", lineTemp);
    }
    if (data[1].length !== 0){
        svg.append("path")
            .datum(data[1])
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", 'green')
            .attr("stroke-width", 2)
            .attr("d", lineAct);
        svg.append("path")
            .datum(data[1])
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", 'green')
            .attr("stroke-width", 2)
            .attr("d", lineTemp);
    }
    focusGroup = svg.append("g").attr("class", "focus");

    // left line
    leftCursor = focusGroup.append("line")
    .attr("class", "cursor-left")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#444")
    .attr("stroke-dasharray", "3,3");

    // right line
    rightCursor = focusGroup.append("line")
    .attr("class", "cursor-right")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#444")
    .attr("stroke-dasharray", "3,3");

    

    leftCursor
  .attr("x1", xScale(startOfDay))
  .attr("x2", xScale(startOfDay));

    rightCursor
    .attr("x1", xScale2(startOfDay))    
    .attr("x2", xScale2(startOfDay));
    


    actDot1  = focusGroup.append("circle").attr("r", 4).attr("fill", "black").style("visibility", "hidden");;   
    tempDot1 = focusGroup.append("circle").attr("r", 4).attr("fill", "black").style("visibility", "hidden");;   
    actDot2  = focusGroup.append("circle").attr("r", 4).attr("fill", "black").style("visibility", "hidden");;  
    tempDot2 = focusGroup.append("circle").attr("r", 4).attr("fill", "black").style("visibility", "hidden");;

    actLabel1  = focusGroup.append("text")
              .attr("class","tooltip").style("font-size","10px")
              .style("visibility","hidden");
    tempLabel1 = focusGroup.append("text")
                .attr("class","tooltip").style("font-size","10px")
                .style("visibility","hidden");
    actLabel2  = focusGroup.append("text")
                .attr("class","tooltip").style("font-size","10px")
                .style("visibility","hidden");
    tempLabel2 = focusGroup.append("text")
                .attr("class","tooltip").style("font-size","10px")
                .style("visibility","hidden");
}

export function updateFocus(time) {
  if (!focusGroup) return;          
    const hasPink  = map1.length   > 0;
    const hasGreen = map2.length   > 0;
  const xLeft  = xScale(time);
  const xRight = xScale2(time);
  leftCursor
    .attr("x1", xLeft)
    .attr("x2", xLeft);  

    rightCursor
    .attr("x1", xRight)
    .attr("x2", xRight);

 
  const bisect = d3.bisector(d => d.date).left;
  if (hasPink){
  const i1   = bisect(map1, time, 1);
  const dL   = map1[i1 - 1], dR = map1[i1] || dL;
  const d    = (time - dL.date) < (dR.date - time) ? dL : dR;

  const cxL = xLeft,  cyL = yScale(d.avg_act);
  const cxR = xRight, cyR = yScale2(d.avg_temp);

  actDot1 .attr("cx", cxL).attr("cy", cyL);
  tempDot1.attr("cx", cxR).attr("cy", cyR);

  placeLabel(actLabel1 , cxL, cyL,
             d.avg_act.toFixed(1),               
             hasGreen ? "bottom-right":"bottom-right");  

  placeLabel(tempLabel1, cxR, cyR,
             d.avg_temp.toFixed(2),
             hasGreen ? "bottom-right":"bottom-right");
} else {
  actLabel1 .style("visibility","hidden");
  tempLabel1.style("visibility","hidden");
}


if (hasGreen){
  const i2   = bisect(map2, time, 1);
  const gL   = map2[i2 - 1], gR = map2[i2] || gL;
  const g    = (time - gL.date) < (gR.date - time) ? gL : gR;

  const cxL = xLeft,  cyL = yScale(g.avg_act);
  const cxR = xRight, cyR = yScale2(g.avg_temp);

  actDot2 .attr("cx", cxL).attr("cy", cyL);
  tempDot2.attr("cx", cxR).attr("cy", cyR);

  placeLabel(actLabel2 , cxL, cyL,
             g.avg_act.toFixed(1),
             hasPink ? "top-left":"bottom-right");   
  placeLabel(tempLabel2, cxR, cyR,
             g.avg_temp.toFixed(2),
             hasPink ? "top-left":"bottom-right");
} else {
  actLabel2 .style("visibility","hidden");
  tempLabel2.style("visibility","hidden");
}
}


let data = await loadData();
renderLinePlot(filtering(data));

document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        d3.select("#chart").selectAll("*").remove();
        renderLinePlot(filtering(data));
    });
});
// let query = '';
// let searchInput = document.querySelector('#searchBar');
// searchInput.addEventListener('change', (event) => {
//     query = event.target.value;
//     let filteredData = data.filter((d) => {
//         let values = query.split(', ');
//         return values.includes(query.toLowerCase());
//     });
//     renderLinePlot(filteredData);
// });

function placeLabel(label, cx, cy, text, where){
  const dx = 6, dy = 6;          
  if (where === "top-left"){
    label.attr("x", cx - dx).attr("y", cy - dy);
  } else { 
    label.attr("x", cx + dx).attr("y", cy + dy + 8); 
  }
  label.text(text).style("visibility","visible");
}
    