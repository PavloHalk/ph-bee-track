import Tpl from './Tpl.js';
import Task from '../models/Task.js';
import { t } from '../i18n.js';
import { secondsToClock } from '../utils.js';

export default class TplStatTaskTotal extends Tpl {
    static get htmlPath() {
        return 'stat-task-total';
    }
    
    get classAttr() {
        return 'tpl tpl-stat-task-total';
    }
    
    #userId = 0;
    #includeArchived = false;

    async init(userId, includeArchived = false) {
        this.#userId = userId;
        this.#includeArchived = includeArchived;

        await this.#getDataAndRender();
    }

    async setIncludeArchived(value) {
        this.#includeArchived = value;
        await this.#getDataAndRender();
    }

    onLanguageChanged() {
        this.#getDataAndRender();
    }

    async #getDataAndRender() {
        const tasks = await Task.allForUser(this.#userId, this.#includeArchived);
        const data = this.#makeData(tasks);

        this.#renderTable(data);
        this.#renderTimeSpentChart(data.body);
        this.#renderInvolvementChart(data.body);
        this.#renderAimChart(data.body);
        this.#renderCompletenessChart(data.body);
    }
    
    #makeData(tasks) {
        const totalTimeElapsed = tasks.reduce((acc, task) => acc + task.time_elapsed_total, 0);
        const totalTimeAim = tasks.reduce((acc, task) => acc + task.time_aim, 0);
        
        const data = { body: [], footer: [] };

        for (const task of tasks) {
            data.body.push({
                color: task.color,
                title: task.name,
                time_aim: task.time_aim,
                time_elapsed_total: task.time_elapsed_total,
                time_percent: (task.time_elapsed_total / task.time_aim * 100),
                involvement: totalTimeElapsed === 0 ? 0 : (task.time_elapsed_total / totalTimeElapsed * 100),
            });
        }
        
        data.footer = {
            color: null,
            title: null,
            time_aim: totalTimeAim,
            time_elapsed_total: totalTimeElapsed,
            time_percent: totalTimeAim === 0 ? 0 : (totalTimeElapsed / totalTimeAim * 100),
            involvement: 100,
        }
        
        return data;
    }

    #renderTable(data) {
        const tableEl = document.getElementById('stat-task-total');
        const rowTemplateEl = document.getElementById('stat-task-total-template')
            .querySelector('tr.template');
        tableEl.tBodies[0].replaceChildren();

        for (const row of data.body) {
            const rowEl = rowTemplateEl.cloneNode(true);
            rowEl.classList.remove('template');
            rowEl.cells[0].querySelector('div.color-box').style.backgroundColor = row.color;
            rowEl.cells[1].textContent = row.title;
            rowEl.cells[2].textContent = secondsToClock(row.time_aim);
            rowEl.cells[3].textContent = secondsToClock(row.time_elapsed_total);
            rowEl.cells[4].textContent = row.time_percent.toFixed(2) + ' %';
            rowEl.cells[5].textContent = row.involvement.toFixed(2) + ' %';
            tableEl.tBodies[0].append(rowEl);
        }

        tableEl.tFoot.rows[0].cells[2].textContent = secondsToClock(data.footer.time_aim);
        tableEl.tFoot.rows[0].cells[3].textContent = secondsToClock(data.footer.time_elapsed_total);
        tableEl.tFoot.rows[0].cells[4].textContent = data.footer.time_percent.toFixed(2) + ' %';
        tableEl.tFoot.rows[0].cells[5].textContent = data.footer.involvement.toFixed(2) + ' %';
    }
    
    #renderTimeSpentChart(data) {
        data = data.toSorted((a, b) => b.time_elapsed_total - a.time_elapsed_total);
        
        const dataForChart = data.slice(0, 5);
        const rest = data.slice(5);
        const chartData = [];
        
        for (const row of dataForChart) {
            chartData.push({
                color: row.color,
                label: row.title,
                value: row.time_elapsed_total,
                valueText: secondsToClock(row.time_elapsed_total)
            })
        }
        
        if (rest.length) {
            chartData.push({
                color: 'black',
                label: t('stats.charts.others'),
                value: rest.reduce((acc, row) => acc + row.time_elapsed_total, 0),
                valueText: secondsToClock(rest.reduce((acc, row) => acc + row.time_elapsed_total, 0))
            })
        }

        const container = this.getElement().querySelector('.diagram-container-time-spent');
        this.#renderChart(container, chartData);
        this.#renderChartLegend(container, chartData);
    }

    #renderInvolvementChart(data) {
        data = data.toSorted((a, b) => b.involvement - a.involvement);

        const dataForChart = data.slice(0, 5);
        const rest = data.slice(5);
        const chartData = [];

        for (const row of dataForChart) {
            chartData.push({
                color: row.color,
                label: row.title,
                value: row.involvement,
                valueText: row.involvement.toFixed(2) + ' %'
            })
        }

        if (rest.length) {
            chartData.push({
                color: 'black',
                label: t('stats.charts.others'),
                value: rest.reduce((acc, row) => acc + row.involvement, 0),
                valueText: rest.reduce((acc, row) => acc + row.involvement, 0).toFixed(2) + ' %'
            })
        }
        
        const container = this.getElement().querySelector('.diagram-container-involvement');
        this.#renderChart(container, chartData);
        this.#renderChartLegend(container, chartData);
    }

    #renderAimChart(data) {
        data = data.toSorted((a, b) => b.time_aim - a.time_aim);

        const dataForChart = data.slice(0, 5);
        const rest = data.slice(5);
        const chartData = [];

        for (const row of dataForChart) {
            chartData.push({
                color: row.color,
                label: row.title,
                value: row.time_aim,
                valueText: secondsToClock(row.time_aim)
            })
        }

        if (rest.length) {
            chartData.push({
                color: 'black',
                label: t('stats.charts.others'),
                value: rest.reduce((acc, row) => acc + row.time_aim, 0),
                valueText: secondsToClock(rest.reduce((acc, row) => acc + row.time_aim, 0))
            })
        }

        const container = this.getElement().querySelector('.diagram-container-time-aim');
        this.#renderChart(container, chartData);
        this.#renderChartLegend(container, chartData);
    }
    
    #renderCompletenessChart(data) {
        data = data.toSorted((a, b) => b.time_percent - a.time_percent);

        const dataForChart = data.slice(0, 5);
        const rest = data.slice(5);
        const chartData = [];

        for (const row of dataForChart) {
            chartData.push({
                color: row.color,
                label: row.title,
                value: row.time_percent,
                valueText: row.time_percent.toFixed(2) + ' %'
            })
        }

        if (rest.length) {
            chartData.push({
                color: 'black',
                label: t('stats.charts.others'),
                value: rest.reduce((acc, row) => acc + row.time_percent, 0),
                valueText: rest.reduce((acc, row) => acc + row.time_percent, 0).toFixed(2) + ' %'
            })
        }

        const container = this.getElement().querySelector('.diagram-container-completeness');
        this.#renderChart(container, chartData);
        this.#renderChartLegend(container, chartData);
    }

    #renderChart(container, chartData) {
        const total = chartData.reduce((acc, row) => acc + row.value, 0);
        const diagram = container.querySelector('.diagram');
        
        diagram.replaceChildren();
        diagram.style.background = '';
        
        if (total === 0) {
            diagram.innerHTML = `<p class="text-center text-danger">${t('stats.charts.noData')}</p>`;
            return;
        }

        let cumulative = 0;
        const segments = [];

        for (const row of chartData) {
            const pct = row.value / total * 100;
            segments.push(`${row.color} ${cumulative.toFixed(4)}% ${(cumulative + pct).toFixed(4)}%`);
            cumulative += pct;
        }
        
        diagram.style.background = `conic-gradient(${segments.join(', ')})`;
    }

    #renderChartLegend(container, chartData) {
        const rowTemplate = this.getElement().querySelector('.row-template');
        const legend = container.querySelector('.legend');
        legend.replaceChildren();
        
        for (const row of chartData) {
            const rowEl = rowTemplate.cloneNode(true);
            rowEl.querySelector('.legend-color').style.backgroundColor = row.color;
            rowEl.children[1].textContent = row.label;
            rowEl.children[2].textContent = row.valueText;

            rowEl.classList.remove('row-template');
            rowEl.classList.remove('d-none');

            legend.appendChild(rowEl);
        }
    }
}