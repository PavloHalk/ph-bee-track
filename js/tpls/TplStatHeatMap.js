import Tpl from './Tpl.js';
import Track from '../models/Track.js';
import { t } from '../i18n.js';
import { secondsToClock } from '../utils.js';

export default class TplStatHeatMap extends Tpl {
    static STEP = 17;
    #year = new Date().getFullYear();
    #userId = 0;
    #includeArchived = false;
    
    static get htmlPath() {
        return 'stat-heat-map';
    }
    
    get classAttr() {
        return 'tpl tpl-stat-heat-map';
    }
    
    async init(userId, includeArchived = false) {
        this.#userId = userId;
        this.#includeArchived = includeArchived;

        setTimeout(async () => {
            await this.#render();

            document.getElementById('bp').addEventListener('click', () => {
                this.#year--;
                this.#render();
            });
            document.getElementById('bn').addEventListener('click', () => {
                this.#year++;
                this.#render();
            });
        });
    }

    async setIncludeArchived(value) {
        this.#includeArchived = value;
        await this.#render();
    }

    onLanguageChanged() {
        this.#render();
    }

    async #render() {
        const months = t('stats.heatmap.months');
        const days = t('stats.heatmap.days');

        document.getElementById('yd').textContent = this.#year.toString();
        const weeks = this.#buildCal();
        const wr = document.getElementById('wr');
        const ml = document.getElementById('ml');
        wr.innerHTML = '';
        ml.innerHTML = '';

        let lastMonth = -1;
        weeks.forEach((week, wi) => {
            for (let di = 0; di < 7; di++) {
                const d = week[di];
                if (d.getFullYear() === this.#year && d.getMonth() !== lastMonth) {
                    lastMonth = d.getMonth();
                    const lbl = document.createElement('div');
                    lbl.className = 'mlabel';
                    lbl.style.left = (wi * TplStatHeatMap.STEP) + 'px';
                    lbl.textContent = months[lastMonth];
                    ml.appendChild(lbl);
                    break;
                }
            }
            const col = document.createElement('div');
            col.className = 'wcol';
            week.forEach(d => {
                const cell = document.createElement('div');
                if (d.getFullYear() !== this.#year) {
                    cell.className = 'day empty';
                } else {
                    cell.className = 'day';
                    cell.dataset.dateStr = `${days[(d.getDay() + 6) % 7]}, ${d.getDate()} ${months[d.getMonth()]} ${this.#year}`;
                    cell.dataset.date = `${this.#year}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                }
                col.appendChild(cell);
            });
            wr.appendChild(col);
        });

        const records = await Track.getYearRecords(this.#userId, this.#year, this.#includeArchived);
        const secondsPerDay = this.#calcSecondsPerDay(records);
        
        const max = Object.values(secondsPerDay).reduce((a, b) => Math.max(a, b), 0);
        
        for (const date in secondsPerDay) {
            const cell = document.querySelector(`[data-date="${date}"]`);
            cell.title = cell.dataset.dateStr;
            
            if (secondsPerDay[date] > 0) {
                const timeStr = secondsToClock(secondsPerDay[date]);

                cell.style.backgroundColor = this.#getHeatColor(secondsPerDay[date], max);
                cell.title += ' - ' + timeStr;
            } else {
                cell.title += ' - 0:00:00';
            }
        }
    }

    #buildCal() {
        const jan1 = new Date(this.#year, 0, 1);
        const dow = jan1.getDay();
        const startOff = dow === 0 ? 6 : dow - 1;
        const start = new Date(jan1);
        start.setDate(start.getDate() - startOff);

        const dec31 = new Date(this.#year, 11, 31);
        const edow = dec31.getDay();
        const endOff = edow === 0 ? 6 : edow - 1;
        const end = new Date(dec31);
        end.setDate(end.getDate() + (6 - endOff));

        const weeks = [];
        const d = new Date(start);
        while (d.getTime() <= end.getTime()) {
            const w = [];
            for (let i = 0; i < 7; i++) { w.push(new Date(d)); d.setDate(d.getDate() + 1); }
            weeks.push(w);
        }
        return weeks;
    }

    #calcSecondsPerDay(records) {
        const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
        const daysInYear = isLeap(this.#year) ? 366 : 365;

        const result = {};
        for (let i = 0; i < daysInYear; i++) {
            const d = new Date(Date.UTC(this.#year, 0, 1 + i));
            result[d.toISOString().slice(0, 10)] = 0;
        }

        const yearBegin = Date.UTC(this.#year, 0, 1);
        const yearEnd   = Date.UTC(this.#year + 1, 0, 1);

        for (const rec of records) {
            const start = new Date(rec.started_at.replace(' ', 'T') + 'Z').getTime();
            const stop  = new Date(rec.stopped_at.replace(' ', 'T') + 'Z').getTime();

            const from = Math.max(start, yearBegin);
            const to   = Math.min(stop, yearEnd);

            if (from >= to) continue;

            const firstDayMs = Math.floor(from / 86400_000) * 86400_000;

            for (let dayMs = firstDayMs; dayMs < to; dayMs += 86400_000) {
                const dayKey = new Date(dayMs).toISOString().slice(0, 10);
                if (!(dayKey in result)) continue;

                const dayFrom = Math.max(from, dayMs);
                const dayTo   = Math.min(to, dayMs + 86400_000);

                result[dayKey] += (dayTo - dayFrom) / 1000;
            }
        }

        return result;
    }

    #getHeatColor(seconds, max) {
        if (!seconds || seconds <= 0) return null;

        // Степенева шкала (gamma > 0.5) тримає короткий час світлим,
        // на відміну від логарифмічної, що роздувала малі значення.
        const ratio = max > 0 ? Math.min(seconds / max, 1) : 0;
        const t = Math.pow(ratio, 0.65); // 0..1

        // Від блідо-блідо-блакитного до темно-темно-синього.
        const r = Math.round(232 - t * (232 - 8));
        const g = Math.round(245 - t * (245 - 27));
        const b = Math.round(255 - t * (255 - 92));
        return `rgb(${r},${g},${b})`;
    }

}