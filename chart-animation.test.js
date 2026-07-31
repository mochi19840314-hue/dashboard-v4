"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");

const app=fs.readFileSync("app.js","utf8");
const css=fs.readFileSync("style.css","utf8");
const html=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("sw.js","utf8");

assert.match(app,/function playChartEntrance\(page\)/,"chart entrance uses the page lifecycle");
assert.match(app,/page\.classList\.add\("charts-entering"\)/,"visible page starts its chart animation");
assert.match(app,/setTimeout\(\(\)=>page\.classList\.remove\("charts-entering"\),800\)/,"entrance state is one-shot");
assert.match(css,/\.charts-entering \.annual-series\{animation:annualSeriesReveal 700ms ease-out both/,"annual lines reveal left to right in 700ms");
assert.match(css,/@keyframes annualSeriesReveal\{from\{clip-path:inset\(0 100% 0 0\)\}/,"annual reveal starts at the left edge");
assert.match(css,/@media\(prefers-reduced-motion:reduce\).*\.charts-entering \.annual-series.*animation:none!important/s,"reduced motion bypasses chart animation");
assert.match(html,/style\.css\?v=1056/);assert.match(html,/app\.js\?v=1056/);
assert.match(sw,/keita-dashboard-v1056-chart-animation/);assert.match(sw,/style\.css\?v=1056/);assert.match(sw,/app\.js\?v=1056/);
console.log("chart animation tests: 9 checks passed");
