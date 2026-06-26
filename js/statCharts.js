import { secondsToClock } from './utils.js';

// Shared rendering helpers for the statistics charts.

// Build a whole-hour Y axis: 0 at the bottom up to a "nice" hour ceiling,
// with up to 6 evenly spaced ticks. The ceiling may sit slightly above the
// tallest bar so the ticks land on round hour values.
export function hourAxis(maxSeconds) {
    const maxHours = maxSeconds / 3600;
    if (maxHours <= 0) return { axisMax: 0, ticks: [0] };

    const maxTicks = 6; // including the 0 and the top tick
    const niceSteps = [1, 2, 3, 5, 10, 15, 20, 25, 30, 50, 100, 150, 200, 250, 500, 1000];

    // Smallest step keeping the tick count within the limit.
    let step = niceSteps[niceSteps.length - 1];
    for (const s of niceSteps) {
        if (Math.ceil(maxHours / s) + 1 <= maxTicks) { step = s; break; }
    }

    const axisMax = Math.ceil(maxHours / step) * step;
    const ticks = [];
    for (let h = 0; h <= axisMax; h += step) ticks.push(h);
    return { axisMax, ticks };
}

// Draws a pie chart into `diagramEl` via a conic-gradient.
// segments — [{ color, value }]. If the total is zero, shows the "no data" note.
export function renderPie(diagramEl, segments, noDataText) {
    const total = segments.reduce((acc, s) => acc + s.value, 0);

    diagramEl.replaceChildren();
    diagramEl.style.background = '';

    if (total <= 0) {
        diagramEl.innerHTML = `<p class="text-center text-danger m-0">${noDataText}</p>`;
        return;
    }

    let cumulative = 0;
    const stops = [];
    for (const s of segments) {
        if (s.value <= 0) continue;
        const pct = s.value / total * 100;
        stops.push(`${s.color} ${cumulative.toFixed(4)}% ${(cumulative + pct).toFixed(4)}%`);
        cumulative += pct;
    }

    diagramEl.style.background = `conic-gradient(${stops.join(', ')})`;
}

// Fills `legendEl` with cloned `rowTemplate` rows.
// rows — [{ color, label, valueText }].
export function renderLegend(legendEl, rowTemplate, rows) {
    legendEl.replaceChildren();

    for (const row of rows) {
        const rowEl = rowTemplate.cloneNode(true);
        rowEl.querySelector('.legend-color').style.backgroundColor = row.color;
        rowEl.children[1].textContent = row.label;
        rowEl.children[2].textContent = row.valueText;

        rowEl.classList.remove('row-template');
        rowEl.classList.remove('d-none');

        legendEl.appendChild(rowEl);
    }
}

// Draws a vertical bar chart (whole-hour Y axis) into `container`.
// labels/values — parallel arrays (one entry per bar); values are seconds.
// The chart uses the `sb-*` classes; the host template must provide their CSS.
export function renderBars(container, labels, values, { hourUnit, noDataText }) {
    container.innerHTML = '';

    const maxValue = Math.max(...values, 0);
    if (maxValue <= 0) {
        const empty = document.createElement('div');
        empty.className = 'sb-empty';
        empty.textContent = noDataText;
        container.appendChild(empty);
        return;
    }

    const axis = hourAxis(maxValue);
    const axisMaxSeconds = axis.axisMax * 3600;

    let axisLabels = '';
    let gridLines = '';
    for (const h of axis.ticks) {
        const bottom = axis.axisMax > 0 ? (h / axis.axisMax) * 100 : 0;
        axisLabels += `<div class="sb-axis-label" style="bottom:${bottom}%">${h} ${hourUnit}</div>`;
        gridLines += `<div class="sb-grid-line" style="bottom:${bottom}%"></div>`;
    }

    // The empty bottom label aligns the scale area with the bars, since each
    // bar column reserves the same space for its label below.
    const axisEl = document.createElement('div');
    axisEl.className = 'sb-axis';
    axisEl.innerHTML = `<div class="sb-axis-scale">${axisLabels}</div><div class="sb-col-label">&nbsp;</div>`;
    container.appendChild(axisEl);

    // Plot area: a gridline overlay behind the bar columns; the grid mirrors a
    // column's structure so its lines line up exactly with the bar area.
    const plot = document.createElement('div');
    plot.className = 'sb-plot';
    const grid = document.createElement('div');
    grid.className = 'sb-grid';
    grid.innerHTML = `<div class="sb-grid-lines">${gridLines}</div><div class="sb-col-label">&nbsp;</div>`;
    plot.appendChild(grid);

    const colsWrap = document.createElement('div');
    colsWrap.className = 'sb-cols';

    for (let i = 0; i < values.length; i++) {
        // Normalize to the axis ceiling; give a non-zero column a minimum,
        // so the bar is visible even for a tiny value.
        const pct = values[i] > 0 && axisMaxSeconds > 0 ? Math.max((values[i] / axisMaxSeconds) * 100, 2) : 0;

        const col = document.createElement('div');
        col.className = 'sb-col';
        col.title = `${labels[i]}: ${secondsToClock(Math.round(values[i]))}`;
        col.innerHTML = `<div class="sb-bars"><div class="sb-bar" style="height:${pct}%"></div></div>`
            + `<div class="sb-col-label">${labels[i]}</div>`;
        colsWrap.appendChild(col);
    }

    plot.appendChild(colsWrap);
    container.appendChild(plot);
}
