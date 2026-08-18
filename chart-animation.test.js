"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");

const app=fs.readFileSync("app.js","utf8");
const css=fs.readFileSync("style.css","utf8");
const html=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("sw.js","utf8");

assert.match(app,/new IntersectionObserver\(/,"chart entrance uses IntersectionObserver");
assert.match(app,/\{threshold:\.25\}/,"observer triggers at 25% visibility");
assert.match(app,/page\.querySelectorAll\("\.chart-card"\)/,"each chart container is observed independently");
assert.match(app,/playedCharts\.has\(chart\)/,"each chart entrance is one-shot");
assert.match(app,/chartObserver\.unobserve\(chart\)/,"played charts stop being observed");
assert.match(app,/disconnectChartObserver\(true\)/,"page changes disconnect and reset chart state");
assert.match(app,/!chart\.closest\("\.page\.active"\)/,"hidden-page charts cannot animate");
assert.match(app,/reducedMotion\(\).*charts\.forEach\(finishChartEntrance\)/,"reduced motion shows the final chart immediately");
assert.match(css,/\.chart-awaiting \.annual-series\{clip-path:inset\(0 100% 0 0\)\}/,"off-screen series remain at their entrance state");
assert.match(css,/\.chart-animating \.annual-series\{animation:annualSeriesReveal 700ms ease-out both/,"annual lines reveal left to right in 700ms");
assert.match(css,/@keyframes annualSeriesReveal\{from\{clip-path:inset\(0 100% 0 0\)\}/,"annual reveal starts at the left edge");
assert.match(css,/@media\(prefers-reduced-motion:reduce\).*\.chart-animating \.annual-series.*animation:none!important/s,"reduced motion bypasses chart animation");
assert.match(css,/@media\(prefers-reduced-motion:reduce\).*\.chart-awaiting \.annual-series\{clip-path:none\}/s,"reduced motion never hides chart data");
assert.match(html,/style\.css\?v=9401/);assert.match(html,/report-month\.js\?v=1061/);assert.match(html,/app\.js\?v=9401/);
assert.match(sw,/keita-dashboard-v9401-clinical-learning/);assert.match(sw,/style\.css\?v=9401/);assert.match(sw,/report-month\.js\?v=1061/);assert.match(sw,/app\.js\?v=9401/);
console.log("chart animation tests: 16 checks passed");
