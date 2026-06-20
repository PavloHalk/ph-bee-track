import Tpl from './Tpl.js';
import Track from '../models/Track.js';
import { t, translateDom } from '../i18n.js';
import { secondsToClock, secondsPerDayOfYear } from '../utils.js';

// Distribution of tracked time by weekday (Mon–Sun) for the selected year.
// Two columns per day: total time over the year and average time per active
// weekday. The metrics have very different scales (total ≈ 50× the average),
// so each is normalized to its own maximum — days are compared within a
// metric, and the exact values are shown by the bar's title.
export default class TplStatWeekdayDist extends Tpl {
    #userId = 0;
    #year = new Date().getFullYear();
    #includeArchived = false;

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
            const weekday = (new Date(key + 'T00:00:00Z').getUTCDay() + 6) % 7;
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

        for (let i = 0; i < 7; i++) {
            // Normalize to the metric's maximum; give a non-zero day a minimum,
            // so the bar is visible even for a tiny value.
            const totalPct = totals[i] > 0 ? Math.max((totals[i] / maxTotal) * 100, 2) : 0;
            const avgPct = averages[i] > 0 ? Math.max((averages[i] / maxAvg) * 100, 2) : 0;

            const col = document.createElement('div');
            col.className = 'wd-day';
            col.title = `${days[i]}\n${totalLabel}: ${secondsToClock(Math.round(totals[i]))}`
                + `\n${avgLabel}: ${secondsToClock(Math.round(averages[i]))}`;
            col.innerHTML = `<div class="wd-bars">`
                + `<div class="wd-bar wd-bar-total" style="height:${totalPct}%"></div>`
                + `<div class="wd-bar wd-bar-avg" style="height:${avgPct}%"></div>`
                + `</div>`
                + `<div class="wd-day-label">${days[i]}</div>`;
            chart.appendChild(col);
        }
    }
}
