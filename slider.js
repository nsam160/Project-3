// slider.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { sliderBottom } from 'https://esm.sh/d3-simple-slider@2.0.0';
import { updateFocus, filterByMinute, renderScatterplot, data} from './global.js';
const startOfDay = new Date(2000, 0, 1, 0, 0);
const timeFormat = d3.timeFormat("%H:%M");
const endOfDay = new Date(2000, 0, 1, 23, 59);
export const timeSlide = sliderBottom()
  .min(startOfDay)
  .max(endOfDay)
  .step(1000 * 60)
  .width(400)
  .tickFormat(timeFormat)
  .ticks(8)
  .default(startOfDay)
  .on('onchange', val => {
    d3.select("#time-label").text(timeFormat(val));
    updateFocus(val);
    d3.select("#scatterplot").selectAll("*").remove();
    renderScatterplot(filterByMinute(data, val));
  });

const svg = d3.select('#year-slider')
  .append('svg')
    .attr('width', 500)
    .attr('height', 100);

svg.append('g')
   .attr('transform', 'translate(30,30)')
   .call(timeSlide);

d3.select("#time-label").text(timeFormat(startOfDay));


