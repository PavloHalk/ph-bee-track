import Tpl from './Tpl.js';
import Track from '../models/Track.js';
import { t, translateDom } from '../i18n.js';
import { secondsToClock, secondsPerDayOfYear } from '../utils.js';

// Distribution of tracked time by weekday (Mon–Sun) for the selected year.
// One bar per day, showing either the total time over the year or the average
// time per active weekday — the mode is switched by a radio toggle. The two
// metrics have very different scales (total ≈ 50× the average), so showing them
// together is confusing; instead only one is shown at a time, normalized to its
// own maximum. The exact values for both are still available in the bar's title.
export default class TplStatWeekdayDist extends Tpl {
    #userId = 0;
    #year = new Date().getFullYear();
    #includeArchived = false;
    #mode = 'total'; // 'total' | 'average'

    static get htmlPath() {
        return 'stat-weekday-bars';
    }

    get classAttr() {
        return 'tpl tpl-stat-weekday-dist';
    }

    async init(userId, year, includeArchived = false) {
        this.#userId = userId;
        this.#year = year ?? new Date().getFullYear();
        this.#includeArchived = includeArchived;

        for (const radio of this.getElement().querySelectorAll('input[name="wd-mode"]')) {
            radio.addEventListener('change', () => {
                this.#mode = radio.value;
                this.#render();
            });
        }

        await this.#render();
    }

    async setYear(year) {
        this.#year = year;
        await this.#render();
    }

    async setIncludeArchived(value) {
        this.#includeArchived = value;
        await this.#render();
    }

    onLanguageChanged() {
        translateDom(this.getElement());
        this.#render();
    }

    async #render() {
        const year = this.#year;
        const includeArchived = this.#includeArchived;

        const records = await Track.getYearRecords(this.#userId, year, includeArchived);

        // While the request was running, the user could have flipped the year or toggled
        // the filter — in that case this result is already stale.
        if (year !== this.#year || includeArchived !== this.#includeArchived) return;

        const perDay = secondsPerDayOfYear(records, year);
        const totals = new Array(7).fill(0);
        const activeDays = new Array(7).fill(0);

        for (const key in perDay) {
            const seconds = perDay[key];
            const weekday = (new Date(key + 'T00:00:00').getDay() + 6) % 7;
            totals[weekday] += seconds;
            if (seconds > 0) activeDays[weekday] += 1;
        }

        const averages = totals.map((total, i) => (activeDays[i] ? total / activeDays[i] : 0));
        const maxTotal = Math.max(...totals, 0);
        const maxAvg = Math.max(...averages, 0);

        const days = t('stats.heatmap.days');
        const totalLabel = t('stats.weekdayDist.total');
        const avgLabel = t('stats.weekdayDist.average');

        const chart = this.getElement().querySelector('.wd-dist-chart');
        chart.innerHTML = '';

        if (maxTotal <= 0) {
            const empty = document.createElement('div');
            empty.className = 'wd-dist-empty';
            empty.textContent = t('stats.charts.noData');
            chart.appendChild(empty);
            return;
        }

        // The active metric drives the bar heights; both values stay in the title.
        const values = this.#mode === 'average' ? averages : totals;
        const maxValue = this.#mode === 'average' ? maxAvg : maxTotal;

        // Whole-hour Y axis from 0 up to a "nice" ceiling; bars normalize to it.
        const axis = this.#hourAxis(maxValue);
        const axisMaxSeconds = axis.axisMax * 3600;
        const hourUnit = t('tasks.form.hoursShort');

        let axisLabels = '';
        let gridLines = '';
        for (const h of axis.ticks) {
            const bottom = axis.axisMax > 0 ? (h / axis.axisMax) * 100 : 0;
            axisLabels += `<div class="wd-axis-label" style="bottom:${bottom}%">${h} ${hourUnit}</div>`;
            gridLines += `<div class="wd-grid-line" style="bottom:${bottom}%"></div>`;
        }
        const axisEl = document.createElement('div');
        axisEl.className = 'wd-axis';
        // The empty bottom label aligns the scale area with the bars, since each
        // day column reserves the same space for its weekday label below.
        axisEl.innerHTML = `<div class="wd-axis-scale">${axisLabels}</div><div class="wd-day-label">&nbsp;</div>`;
        chart.appendChild(axisEl);

        // Plot area: a gridline overlay (lines at each Y tick, spanning all days)
        // behind the day columns. The grid mirrors a day column's structure so its
        // lines line up exactly with the bar area.
        const plot = document.createElement('div');
        plot.className = 'wd-plot';
        const grid = document.createElement('div');
        grid.className = 'wd-grid';
        grid.innerHTML = `<div class="wd-grid-lines">${gridLines}</div><div class="wd-day-label">&nbsp;</div>`;
        plot.appendChild(grid);

        const daysWrap = document.createElement('div');
        daysWrap.className = 'wd-days';

        for (let i = 0; i < 7; i++) {
            // Normalize to the axis ceiling; give a non-zero day a minimum,
            // so the bar is visible even for a tiny value.
            const pct = values[i] > 0 && axisMaxSeconds > 0 ? Math.max((values[i] / axisMaxSeconds) * 100, 2) : 0;

            const col = document.createElement('div');
            col.className = 'wd-day';
            col.title = `${days[i]}\n${totalLabel}: ${secondsToClock(Math.round(totals[i]))}`
                + `\n${avgLabel}: ${secondsToClock(Math.round(averages[i]))}`;
            col.innerHTML = `<div class="wd-bars">`
                + `<div class="wd-bar${this.#mode === 'average' ? ' wd-bar-avg' : ''}" style="height:${pct}%"></div>`
                + `</div>`
                + `<div class="wd-day-label">${days[i]}</div>`;
            daysWrap.appendChild(col);
        }

        plot.appendChild(daysWrap);
        chart.appendChild(plot);
    }

    // Build a whole-hour Y axis: 0 at the bottom up to a "nice" hour ceiling,
    // with up to 6 evenly spaced ticks. The ceiling may sit slightly above the
    // tallest bar so the ticks land on round hour values.
    #hourAxis(maxSeconds) {
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
}
