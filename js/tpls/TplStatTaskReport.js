import Tpl from './Tpl.js';
import Task from '../models/Task.js';
import Track from '../models/Track.js';
import { t, translateDom } from '../i18n.js';
import { secondsToClock, signedSecondsToClock, accumulateTrackTime } from '../utils.js';
import { renderPie, renderLegend, renderBars } from '../statCharts.js';

// Report for a single task: a task selector plus charts and a table, all computed
// over the whole tracking period. The selector follows the shared "include archived"
// filter; opened either from the stats tab or programmatically with a task id.
export default class TplStatTaskReport extends Tpl {
    // Neutral fills for the synthetic chart slices (not a real task color).
    static REMAINING_COLOR = '#dde0e3';
    static OTHERS_COLOR = '#dde0e3';

    #userId = 0;
    #includeArchived = false;
    #selectedId = null;

    static get htmlPath() {
        return 'stat-task-report';
    }

    get classAttr() {
        return 'tpl tpl-stat-task-report';
    }

    async init(userId, includeArchived = false, taskId = null) {
        this.#userId = userId;
        this.#includeArchived = includeArchived;

        this.#select().addEventListener('change', () => {
            const value = this.#select().value;
            this.#selectedId = value ? Number(value) : null;
            this.#render();
        });

        await this.#fillOptions();
        if (taskId) this.selectTask(taskId);
    }

    async setIncludeArchived(value) {
        this.#includeArchived = value;
        // Refill keeps the current task selected if it is still listed; otherwise
        // the selection (and the report) is reset.
        await this.#fillOptions();
    }

    // Programmatic selection (e.g. opened from another screen). No-op if the task
    // is not in the current option set (hidden by the archived filter).
    selectTask(taskId) {
        const select = this.#select();
        const idStr = String(taskId);
        if (![...select.options].some((o) => o.value === idStr)) return;

        select.value = idStr;
        this.#selectedId = Number(taskId);
        this.#render();
    }

    // Re-query and re-render the selected task's report (fresh data).
    async refresh() {
        await this.#render();
    }

    onLanguageChanged() {
        translateDom(this.getElement());
        // Refilling rewrites the placeholder text and re-renders the report.
        this.#fillOptions();
    }

    #select() {
        return this.getElement().querySelector('.task-report-select');
    }

    async #fillOptions() {
        const previous = this.#selectedId;
        const tasks = await Task.allForUser(this.#userId, this.#includeArchived);

        const select = this.#select();
        select.replaceChildren();

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = t('stats.taskReport.selectPlaceholder');
        select.appendChild(placeholder);

        for (const task of tasks) {
            const option = document.createElement('option');
            option.value = String(task.id);
            option.textContent = task.name;
            select.appendChild(option);
        }

        if (previous != null && tasks.some((task) => task.id === previous)) {
            select.value = String(previous);
            this.#selectedId = previous;
        } else {
            select.value = '';
            this.#selectedId = null;
        }

        await this.#render();
    }

    async #render() {
        const content = this.getElement().querySelector('.task-report-content');
        const empty = this.getElement().querySelector('.task-report-empty');

        if (this.#selectedId == null) {
            content.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        const requestId = this.#selectedId;

        // The "share" charts compare this task against all the user's tasks, so the
        // full set is needed alongside the task's own tracks.
        const [tasks, tracks] = await Promise.all([
            Task.allForUser(this.#userId, this.#includeArchived),
            Track.getAllForTask(requestId),
        ]);

        // The selection could have changed while the queries were in flight.
        if (requestId !== this.#selectedId) return;

        const task = tasks.find((tk) => tk.id === requestId);
        if (!task) {
            content.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }

        empty.classList.add('d-none');
        content.classList.remove('d-none');

        this.#renderHeader(task);
        this.#renderGoalChart('.diagram-container-goal', task, task.time_elapsed);
        this.#renderGoalChart('.diagram-container-goal-total', task, task.time_elapsed_total);
        this.#renderShareChart('.diagram-container-share', task, tasks, 'time_elapsed');
        this.#renderShareChart('.diagram-container-share-total', task, tasks, 'time_elapsed_total');
        this.#renderShareChart('.diagram-container-share-aim', task, tasks, 'time_aim');

        const activity = accumulateTrackTime(tracks);
        this.#renderActivity(activity, task.color);
        this.#renderTable(task, tasks, activity);
    }

    #renderHeader(task) {
        this.getElement().querySelector('.task-report-title').textContent =
            t('stats.taskReport.title', { name: task.name });
        this.getElement().querySelector('.task-report-description').textContent = task.description || '';
        this.getElement().querySelector('.task-report-divider').style.backgroundColor = task.color;
    }

    // Goal completion: a "done" slice plus a "remaining to goal" slice. When the
    // goal is exceeded the remaining slice is dropped from the pie (its caption
    // line stays, showing a negative time and a sub-100% remaining percent).
    #renderGoalChart(selector, task, spent) {
        const aim = task.time_aim;
        const donePct = aim > 0 ? spent / aim * 100 : 0;
        const remaining = aim - spent;
        const remainingPct = aim > 0 ? remaining / aim * 100 : 0;

        const segments = [
            { color: task.color, value: spent },
            { color: TplStatTaskReport.REMAINING_COLOR, value: Math.max(remaining, 0) },
        ];

        const rows = [
            {
                color: task.color,
                label: t('stats.taskReport.charts.done'),
                valueText: `${secondsToClock(spent)} (${donePct.toFixed(2)} %)`,
            },
            {
                color: TplStatTaskReport.REMAINING_COLOR,
                label: t('stats.taskReport.charts.remaining'),
                valueText: `${signedSecondsToClock(remaining)} (${remainingPct.toFixed(2)} %)`,
            },
        ];

        this.#paintChart(selector, segments, rows);
    }

    // Share of this task vs. all the others combined, by the given metric.
    #renderShareChart(selector, task, tasks, metric) {
        const total = tasks.reduce((acc, tk) => acc + tk[metric], 0);
        const own = task[metric];
        const others = total - own;

        const ownPct = total > 0 ? own / total * 100 : 0;
        const othersPct = total > 0 ? others / total * 100 : 0;

        const segments = [
            { color: task.color, value: own },
            { color: TplStatTaskReport.OTHERS_COLOR, value: others },
        ];

        const rows = [
            {
                color: task.color,
                label: t('stats.taskReport.charts.thisTask'),
                valueText: `${ownPct.toFixed(2)} %`,
            },
            {
                color: TplStatTaskReport.OTHERS_COLOR,
                label: t('stats.taskReport.charts.others'),
                valueText: `${othersPct.toFixed(2)} %`,
            },
        ];

        this.#paintChart(selector, segments, rows);
    }

    #paintChart(selector, segments, rows) {
        const container = this.getElement().querySelector(selector);
        const rowTemplate = this.getElement().querySelector('.row-template');

        renderPie(container.querySelector('.diagram'), segments, t('stats.charts.noData'));
        renderLegend(container.querySelector('.legend'), rowTemplate, rows);
    }

    #renderActivity({ byWeekday, byHour }, barColor) {
        const dayNames = t('stats.heatmap.days');
        const hourUnit = t('tasks.form.hoursShort');
        const noData = t('stats.charts.noData');

        renderBars(
            this.getElement().querySelector('.diagram-container-weekday .sb-chart'),
            dayNames, byWeekday, { hourUnit, noDataText: noData, barColor }
        );
        renderBars(
            this.getElement().querySelector('.diagram-container-hour .sb-chart'),
            Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')),
            byHour, { hourUnit, noDataText: noData, barColor }
        );

        const weekdayCaption = this.getElement().querySelector('.weekday-caption');
        const dayIdx = this.#maxIndex(byWeekday);
        weekdayCaption.textContent = dayIdx < 0 ? ''
            : t('stats.taskReport.mostActiveDay', { day: dayNames[dayIdx] });

        const hourCaption = this.getElement().querySelector('.hour-caption');
        const hourIdx = this.#maxIndex(byHour);
        hourCaption.textContent = hourIdx < 0 ? ''
            : t('stats.taskReport.mostActiveHour', { range: this.#hourRange(hourIdx) });
    }

    #renderTable(task, tasks, { byWeekday, byHour }) {
        const aim = task.time_aim;
        const donePct = aim > 0 ? task.time_elapsed / aim * 100 : 0;
        const donePctTotal = aim > 0 ? task.time_elapsed_total / aim * 100 : 0;

        const share = (metric) => {
            const total = tasks.reduce((acc, tk) => acc + tk[metric], 0);
            return total > 0 ? task[metric] / total * 100 : 0;
        };

        const dayNames = t('stats.heatmap.days');
        const dayIdx = this.#maxIndex(byWeekday);
        const hourIdx = this.#maxIndex(byHour);
        const dash = '—';

        const rows = [
            [t('stats.taskReport.table.timeAim'), secondsToClock(task.time_aim)],
            [t('stats.taskReport.table.timeSpent'), secondsToClock(task.time_elapsed)],
            [t('stats.taskReport.table.timeSpentTotal'), secondsToClock(task.time_elapsed_total)],
            [t('stats.taskReport.table.completeness'), donePct.toFixed(2) + ' %'],
            [t('stats.taskReport.table.completenessTotal'), donePctTotal.toFixed(2) + ' %'],
            [t('stats.taskReport.table.share'), share('time_elapsed').toFixed(2) + ' %'],
            [t('stats.taskReport.table.shareTotal'), share('time_elapsed_total').toFixed(2) + ' %'],
            [t('stats.taskReport.table.mostActiveDay'), dayIdx < 0 ? dash : dayNames[dayIdx]],
            [t('stats.taskReport.table.mostActiveHours'), hourIdx < 0 ? dash : this.#hourRange(hourIdx)],
        ];

        const tbody = this.getElement().querySelector('.task-report-table tbody');
        tbody.replaceChildren();
        for (const [indicator, value] of rows) {
            const tr = document.createElement('tr');
            const indicatorCell = document.createElement('td');
            indicatorCell.textContent = indicator;
            const valueCell = document.createElement('td');
            valueCell.textContent = value;
            tr.append(indicatorCell, valueCell);
            tbody.appendChild(tr);
        }
    }

    // Index of the largest positive value, or -1 if every value is zero.
    #maxIndex(values) {
        let idx = -1;
        let max = 0;
        for (let i = 0; i < values.length; i++) {
            if (values[i] > max) { max = values[i]; idx = i; }
        }
        return idx;
    }

    #hourRange(hour) {
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(hour)}:00 - ${pad((hour + 1) % 24)}:00`;
    }
}
