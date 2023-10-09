/*
 * Copyright (c) 2023 Inimi | InimicalPart | Incoverse
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import Discord, { CommandInteractionOptionResolver, Message } from "discord.js";
import { IRISGlobal } from "../../interfaces/global.js";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { exec } from "child_process";
import svg2png from "convert-svg-to-png"
import * as d3 from "d3"
import { JSDOM } from "jsdom";
import { existsSync, readFileSync } from "fs";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const execPromise = promisify(exec);
export async function runSubCommand(
  interaction: Discord.CommandInteraction,
  RM: object
) {
  await interaction.deferReply();
  const type = (
    interaction.options as CommandInteractionOptionResolver
  ).getString("type", true);
  const timeframe = (
    interaction.options as CommandInteractionOptionResolver
  ).getString("timeframe", true);
  let year = (
    interaction.options as CommandInteractionOptionResolver
  ).getInteger("year", false);
  let raw = (
    interaction.options as CommandInteractionOptionResolver
  ).getBoolean("raw", false);

  // if timeframe isnt 1y but year is specified and its not the current year, return
  if (timeframe != "1y" && year && year != new Date().getFullYear())
    return interaction.editReply({
      content: "You can only specify a year when the timeframe is ``1 year``",
    });
  // if timeframe is 1y but year isnt specified, set year to current year
  if (!year) year = new Date().getFullYear();

  // check if the year is a valid integer (Discord already does this but just in case since we're specifying it to a path. We don't want a path traversal attack. Better safe than sorry.)
  if (year && isNaN(year))
    return interaction.editReply({
      content: "The year must be a valid integer",
    });

  // check if the data file exists for the specified year
  if (!existsSync(`./data/${year}.json`))
    return interaction.editReply({
      content: `There is no data for the year '${year}'`,
    });

  // get the data
  let data: object | Array<object> = JSON.parse(readFileSync(`./data/${year}.json`, "utf-8"));

  for (let key of Object.keys(data)) {
    data[key] = !data[key][type] && data[key][type] !== 0 ? null : data[key][type];
  }

  // add missing dates
  const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
  let currentDate = startDate;
  while (currentDate <= endDate) {
    // if (Math.floor(Math.random() * 5) + 1 == 1) {
      if (Object.keys(data).includes(currentDate.toISOString()))
      data[currentDate.toISOString()] = null // data will show up as missing in the chart
    // } else {
    //   if (!data[currentDate.toISOString()])
    //   data[currentDate.toISOString()] = 800 + Math.floor(Math.random() * 10); // data will show up as missing in the chart
    // }
    currentDate = new Date(currentDate.getTime() + 1800000 * 1);
  }

  // if the timeframe is 1d, get the last 24 hours of data, if there isnt enough data, get as much as you can of the last 48 hours, then add the remaining time in future dates
  if (timeframe !== "1y") {

    // 48 entries = 24 hours (1 entry every 30 minutes)
    // 336 entries = 7 days (1 entry every 30 minutes)
    // 1488 entries = 31 days (1 entry every 30 minutes)
    // 17520 entries = 365 days (1 entry every 30 minutes)
    let amountOfEntries = timeframe == "1d" ? 48 : timeframe == "1w" ? 336 : timeframe == "1m" ? 1488 : 17520;



    const now = new Date();
    const lastTimes = new Date(now.getTime() - (amountOfEntries/2) * 60 * 60 * 1000) < startDate ? startDate : new Date(now.getTime() - (amountOfEntries/2) * 60 * 60 * 1000);
    const lastTimesData = Object.keys(data).filter(
      (key) => new Date(key) >= lastTimes && new Date(key) <= now
    );
    if (lastTimesData.length < amountOfEntries) {
      // last entry in lastTimesData
      const lastEntry = new Date(lastTimesData[lastTimesData.length - 1]);
      // last entry + 30 minutes until there are exactly amountOfEntries entries
      let currentDate = new Date(lastEntry.getTime() + 1800000); // 30 minutes
      while (lastTimesData.length < amountOfEntries) {
        lastTimesData.push(currentDate.toISOString());
        currentDate = new Date(currentDate.getTime() + 1800000); // 30 minutes
      }
    }
    const lastTimesDataObject = {};
    for (let key of lastTimesData) {
      lastTimesDataObject[key] = data[key];
    }
    data = lastTimesDataObject;
  }
  // sort the data by date
  const sorted = Object.keys(data)
    .sort()
    .reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {});

    if (raw) {
      let attachment = new Discord.AttachmentBuilder(Buffer.from(JSON.stringify(sorted, null, 2)), {
        name: "raw-"+type+"-"+year+"-"+timeframe+".json",
      });
      await interaction.editReply({
        content: "Here you go!",
        files: [attachment],
      });
      return
    }

  const chartWidth = 2400;
  const chartHeight = 1200;

  const window = (new JSDOM(`<html><head><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet"></head><body></body></html>`, { pretendToBeVisual: true })).window;

  window.d3 = d3.select(window.document); //get d3 into the dom

  // make line chart
  let chart = window.d3.select("body")
      .append('div').attr('class','chart')
      .append('svg')
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .append("g")
      .attr("transform", "translate(40,40)");

  // create scales
  let xScale = d3.scaleTime().range([0, chartWidth - 150]);
  let yScale = d3.scaleLinear().range([chartHeight - 200, 0]);

  // create axes
  let xAxis = d3.axisBottom(xScale);
  let yAxis = d3.axisLeft(yScale);

  // make background white
  chart.append("rect")
      .attr("x", -200)
      .attr("y", -400)
      .attr("width", chartWidth+200)
      .attr("height", chartHeight+400)
      .attr("fill", "white");

  // create line generator
  let line = d3.line()
      .x(function(d:any) { return xScale(d.date); })
      .y(function(d:any) { return yScale(d.value); });

  // data is formatted like this: {"2023-10-08T11:30:00.000Z": 123, "2023-10-08T12:00:00.000Z": 456, ...}
  // convert the data into an array of objects with the date and value
  data = Object.keys(sorted).map(function(key) {
      return {
          date: new Date(key),
          value: sorted[key]
      };
  });

  // remove null values
  let dataDenullified = []
  for (let i = 0; i < (data as Array<object>).length; i++) {
      if (data[i].value != null) dataDenullified.push(data[i])
  } 

  // set the domains
  xScale.domain(d3.extent(data, function(d:any) { return d.date; })); // extent = highest and lowest points, d3.extent returns [lowest, highest]
  yScale.domain([d3.min(data, function(d:any) { return d.value; })-20 < 0 ? 0 : d3.min(data, function(d:any) { return d.value; })-20, d3.max(data, function(d:any) { return d.value; })+10]); // d3.min returns the lowest point, d3.max returns the highest point, minus 20 and plus 10 to make the chart look nicer

  // add the x axis
  chart.append("g")
    .attr("class", "x axis")
    .style("font-size", "20px")
    .attr("transform", "translate(50," + (chartHeight - 100) + ")")
    .call(xAxis);

  // add the y axis
  chart.append("g")
    .attr("class", "y axis")
    .style("font-size", "20px")
    .attr("transform", "translate(50," + 100 + ")")
    .call(yAxis);


  // convert data into clumps of data separated by null values, e.g [1,243,234,23,53,4,null,null,432423,null,52345,52353] -> [[1,243,234,23,53,4],[432423],[52345,52353]]
  let dataClumps = []
  let currentClump = []
  for (let i = 0; i < (data as Array<object>).length; i++) {
      if (data[i].value != null) currentClump.push(data[i])
      else if (currentClump.length>0) { dataClumps.push(currentClump); currentClump = [] }
  }
  if (currentClump.length>0) dataClumps.push(currentClump)


  // for each clump of data, get the last value if its the first clump, then the first and last of the other clumps, and last but not least only the first value if its the last clump. but these points into a seperate clump
  // e.g [[1,243,234,23,53,4],[432423],[52345,52353]] -> [[4,432423],[432423,52345]]
  let missingDataBridges = []
  if (dataClumps.length > 1) {
    for (let i = 0; i < dataClumps.length; i++) {
      if (i == 0) missingDataBridges.push([dataClumps[i][dataClumps[i].length-1], dataClumps[i+1][0]])
      else if (i == dataClumps.length-1) continue
    else missingDataBridges.push([dataClumps[i][dataClumps[i].length-1], dataClumps[i+1][0]])
  }
}



  // add the connection lines
  // dataClumps
  for (let i = 0; i < dataClumps.length; i++) {
    if (dataClumps[i].length == 1) continue
    chart.append("path")
    .datum(dataClumps[i])
    .attr("class", "line")
    .attr("transform", "translate(50," + 100 + ")")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2.5)
    .attr("d", line);
  }

  for (let i = 0; i < missingDataBridges.length; i++) {
  chart.append("path")
    .datum(missingDataBridges[i])
    .attr("class", "line")
    .attr("transform", "translate(50," + 100 + ")")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    // opacity
    .attr("stroke-opacity", 0.95)
    .attr("stroke-dasharray", "5,5")
    .attr("stroke-width", 2)
    .attr("d", line);
  }
  let period = timeframe == "1d" ? "24h" : timeframe=="1w"?"week": timeframe == "1m" ? "month" : timeframe == "1y" ? "year" : "day"

  // add title
  chart.append("text")
    .text("'"+type+"' statistics for the last " + period + " (UTC)")
    .style("font-size", "46px")
    .style("color", "black")
    .style("fill", "black")
    .style("font-family", "'Inter', sans-serif")
    .attr("text-anchor", "middle")
    .attr("x", chartWidth / 2)
    .attr("y", 25);

  // add points
  chart.append("g")
    .attr("class", "points")
    .selectAll("circle")
    .data(dataDenullified)
    .enter()
    .append("circle")
    .attr("cx", function(d:any) { return xScale(d.date) + 50; })
    .attr("cy", function(d:any) { return yScale(d.value) + 100; })
    .attr("r", 5)
    .attr("fill", "steelblue");

    const pngBuffer = await svg2png.convert(window.d3.select('.chart').html())
    const attachment = new Discord.AttachmentBuilder(pngBuffer, {
      name: "chart.png",
    });
    await interaction.editReply({
      content: "Here you go!",
      files: [attachment],
    });
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
