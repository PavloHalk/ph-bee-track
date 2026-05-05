import Tpl from './Tpl.js';
import Task from '../Models/Task.js';

export default class TplStatTaskTotal extends Tpl {
    static get htmlPath() {
        return 'stat-task-total';
    }
    
    get classAttr() {
        return 'tpl tpl-stat-task-total';
    }
    
    async init(userId) {
        const filterForm = this.getElement().querySelector('form[name="stat-task-total-filter-form"]');
        
        await this.#getDataAndRender(userId, filterForm);
        filterForm.elements['show-archived'].addEventListener('change', this.#getDataAndRender.bind(this, userId, filterForm));
    }

    async #getDataAndRender(userId, filterForm) {
        const tasks = await Task.allForUser(userId, filterForm.elements['show-archived'].checked);
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
                involvement: totalTimeElapsed === 0 ? '0' : (task.time_elapsed_total / totalTimeElapsed * 100),
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

    #secondsToTime(sec) {
        const o = {
            s: sec % 60,
            m: Math.floor((sec % 3600) / 60),
            h: Math.floor(sec / 3600)
        }
        
        return `${o.h}:${o.m.toString().padStart(2, '0')}:${o.s.toString().padStart(2, '0')}`;
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
            rowEl.cells[2].textContent = this.#secondsToTime(row.time_aim);
            rowEl.cells[3].textContent = this.#secondsToTime(row.time_elapsed_total);
            rowEl.cells[4].textContent = row.time_percent.toFixed(2) + ' %';
            rowEl.cells[5].textContent = row.involvement.toFixed(2) + ' %';
            tableEl.tBodies[0].append(rowEl);
        }

        tableEl.tFoot.rows[0].cells[2].textContent = this.#secondsToTime(data.footer.time_aim);
        tableEl.tFoot.rows[0].cells[3].textContent = this.#secondsToTime(data.footer.time_elapsed_total);
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
                valueText: this.#secondsToTime(row.time_elapsed_total)
            })
        }
        
        if (rest.length) {
            chartData.push({
                color: 'black',
                label: 'Інші',
                value: rest.reduce((acc, row) => acc + row.time_elapsed_total, 0),
                valueText: this.#secondsToTime(rest.reduce((acc, row) => acc + row.time_elapsed_total, 0))
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
                label: 'Інші',
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
                valueText: this.#secondsToTime(row.time_aim)
            })
        }

        if (rest.length) {
            chartData.push({
                color: 'black',
                label: 'Інші',
                value: rest.reduce((acc, row) => acc + row.time_aim, 0),
                valueText: this.#secondsToTime(rest.reduce((acc, row) => acc + row.time_aim, 0))
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
                label: 'Інші',
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
            container.querySelector('.diagram').innerHTML = '<p class="text-center text-danger">Немає даних</p>';
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