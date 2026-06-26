import Tpl from './Tpl.js';
import TplStatTaskTotal from './TplStatTaskTotal.js';
import TplStatHeatMap from './TplStatHeatMap.js';
import TplStatWeekdayDist from './TplStatWeekdayDist.js';
import TplStatWeekCalendar from './TplStatWeekCalendar.js';
import TplStatTaskReport from './TplStatTaskReport.js';

export default class TplStatContainer extends Tpl {
    // While a timer is running, the open stats page is refreshed on this cadence.
    static AUTO_REFRESH_MS = 10000;

    #userId = 0;
    #timer = null;
    #activeTab = 'general';
    #refreshInterval = null;
    #taskTotal = null;
    #heatMap = null;
    #weekdayDist = null;
    #detailRow = null;
    #weekCalendar = null;
    #taskReport = null;
    #onTimerStopped = null;

    static get htmlPath() {
        return 'stat-container';
    }

    get classAttr() {
        return 'tpl tpl-stat-container';
    }

    async init(userId, taskId = null, timer = null) {
        this.#userId = userId;
        this.#timer = timer;
        const filterForm = this.getElement().querySelector('form[name="stat-filter-form"]');

        // Switching to an already-opened tab refreshes its data; clicking the tab
        // that is already shown does nothing (it is the auto-refreshed current page).
        this.getElement().querySelector('.stat-nav-tab-general').addEventListener('click', async (event) => {
            if (!event.target.closest('.stat-nav-tab') || this.#activeTab === 'general') return;
            await this.#showGeneral();
        });

        this.getElement().querySelector('.stat-nav-tab-detailed').addEventListener('click', async (event) => {
            if (!event.target.closest('.stat-nav-tab') || this.#activeTab === 'detailed') return;
            await this.#showDetailed(filterForm.elements['show-archived'].checked);
        });

        this.getElement().querySelector('.stat-nav-tab-task').addEventListener('click', async (event) => {
            if (!event.target.closest('.stat-nav-tab') || this.#activeTab === 'task') return;
            await this.#showTaskReport(filterForm.elements['show-archived'].checked);
        });

        filterForm.elements['show-archived'].addEventListener('change', async (event) => {
            const includeArchived = event.target.checked;
            await this.#taskTotal?.setIncludeArchived(includeArchived);
            await this.#heatMap?.setIncludeArchived(includeArchived);
            await this.#weekdayDist?.setIncludeArchived(includeArchived);
            await this.#weekCalendar?.setIncludeArchived(includeArchived);
            await this.#taskReport?.setIncludeArchived(includeArchived);
        });

        this.#taskTotal = await TplStatTaskTotal.create(userId);
        this.getElement().append(this.#taskTotal.getElement());

        // Opened with a task id (from another screen): jump straight to the report.
        if (taskId) {
            await this.#showTaskReport(filterForm.elements['show-archived'].checked, taskId);
        }

        // Keep the currently shown page current while a timer is running. The
        // interval stops itself once this container is detached from the DOM.
        this.#refreshInterval = setInterval(() => {
            if (!this.getElement().isConnected) {
                clearInterval(this.#refreshInterval);
                return;
            }
            if (this.#timer?.isRunning()) this.#refreshActiveTab();
        }, TplStatContainer.AUTO_REFRESH_MS);

        // Stopping a timer finalizes the data, so refresh the open page right away
        // instead of waiting for the next auto-refresh tick. Self-removing once
        // this container is gone.
        this.#onTimerStopped = () => {
            if (!this.getElement().isConnected) {
                document.removeEventListener('timer-stopped', this.#onTimerStopped);
                return;
            }
            this.#refreshActiveTab();
        };
        document.addEventListener('timer-stopped', this.#onTimerStopped);
    }

    #setActiveTab(suffix) {
        this.#activeTab = suffix;
        for (const tab of this.getElement().querySelectorAll('.stat-nav-tab')) {
            tab.classList.toggle('active', tab.classList.contains(`stat-nav-tab-${suffix}`));
        }
    }

    // Re-query the data of whichever page is currently shown.
    async #refreshActiveTab() {
        if (this.#activeTab === 'general') {
            await this.#taskTotal?.refresh();
        } else if (this.#activeTab === 'detailed') {
            await this.#heatMap?.refresh();
            await this.#weekdayDist?.refresh();
            await this.#weekCalendar?.refresh();
        } else if (this.#activeTab === 'task') {
            await this.#taskReport?.refresh();
        }
    }

    async #showGeneral() {
        this.#setActiveTab('general');
        this.#detailRow?.classList.add('d-none');
        this.getElement().querySelector('.tpl-stat-week-calendar')?.classList.add('d-none');
        this.#taskReport?.getElement().classList.add('d-none');
        this.#taskTotal.getElement().classList.remove('d-none');

        // Always a re-visit (general exists from init), so pull fresh data.
        await this.#taskTotal.refresh();
    }

    async #showDetailed(includeArchived) {
        this.#setActiveTab('detailed');

        if (!this.#detailRow) {
            // The heat map and the weekday distribution live in one
            // row: narrow — stacked in a column, wide — map on the left (fixed),
            // distribution on the right (stretches). The layout is defined by CSS in the fragment.
            this.#detailRow = document.createElement('div');
            this.#detailRow.className = 'stat-detailed-row';
            this.getElement().append(this.#detailRow);

            this.#heatMap = await TplStatHeatMap.create(this.#userId, includeArchived);
            this.#detailRow.append(this.#heatMap.getElement());

            this.#weekdayDist = await TplStatWeekdayDist.create(this.#userId, this.#heatMap.year, includeArchived);
            this.#detailRow.append(this.#weekdayDist.getElement());

            this.#heatMap.setOnYearChanged((year) => this.#weekdayDist.setYear(year));

            this.#weekCalendar = await TplStatWeekCalendar.create(this.#userId, includeArchived);
            this.getElement().append(this.#weekCalendar.getElement());
        } else {
            // Re-visit: pull fresh data into the already-built widgets.
            await this.#heatMap.refresh();
            await this.#weekdayDist.refresh();
            await this.#weekCalendar.refresh();
        }

        this.#taskTotal.getElement().classList.add('d-none');
        this.#taskReport?.getElement().classList.add('d-none');
        this.#detailRow.classList.remove('d-none');
        this.getElement().querySelector('.tpl-stat-week-calendar')?.classList.remove('d-none');
    }

    async #showTaskReport(includeArchived, taskId = null) {
        this.#setActiveTab('task');

        if (!this.#taskReport) {
            this.#taskReport = await TplStatTaskReport.create(this.#userId, includeArchived, taskId);
            this.getElement().append(this.#taskReport.getElement());
        } else if (taskId) {
            this.#taskReport.selectTask(taskId);
        } else {
            // Re-visit without a target task: refresh the current selection.
            await this.#taskReport.refresh();
        }

        this.#taskTotal.getElement().classList.add('d-none');
        this.#detailRow?.classList.add('d-none');
        this.getElement().querySelector('.tpl-stat-week-calendar')?.classList.add('d-none');
        this.#taskReport.getElement().classList.remove('d-none');
    }
}
