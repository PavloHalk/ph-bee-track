import Tpl from './Tpl.js';
import Track from '../models/Track.js';
import { t } from '../i18n.js';
import { secondsToClock, secondsPerDayOfYear } from '../utils.js';

export default class TplStatHeatMap extends Tpl {
    static STEP = 17;
    #year = new Date().getFullYear();
    #userId = 0;
    #includeArchived = false;
    #onYearChanged = null;

    get year() {
        return this.#year;
    }

    // Callback invoked after year navigation (a sibling report
    // hooks in through it to update together with the map).
    setOnYearChanged(callback) {
        this.#onYearChanged = callback;
    }
    
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

            document.getElementById('bp').addEventListener('click', async () => {
                this.#year--;
                await this.#render();
                this.#onYearChanged?.(this.#year);
            });
            document.getElementById('bn').addEventListener('click', async () => {
                this.#year++;
                await this.#render();
                this.#onYearChanged?.(this.#year);
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
        const secondsPerDay = secondsPerDayOfYear(records, this.#year);
        
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

    #getHeatColor(seconds, max) {
        if (!seconds || seconds <= 0) return null;

        // A power scale (gamma > 0.5) keeps short time light,
        // unlike a logarithmic one, which inflated small values.
        const ratio = max > 0 ? Math.min(seconds / max, 1) : 0;
        const t = Math.pow(ratio, 0.65); // 0..1

        // From very-very-pale blue to very-very-dark blue.
        const r = Math.round(232 - t * (232 - 8));
        const g = Math.round(245 - t * (245 - 27));
        const b = Math.round(255 - t * (255 - 92));
        return `rgb(${r},${g},${b})`;
    }

}