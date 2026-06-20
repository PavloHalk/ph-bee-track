import Tpl from './Tpl.js';
import TplStatTaskTotal from './TplStatTaskTotal.js';
import TplStatHeatMap from './TplStatHeatMap.js';
import TplStatWeekdayDist from './TplStatWeekdayDist.js';
import TplStatWeekCalendar from './TplStatWeekCalendar.js';

export default class TplStatContainer extends Tpl {
    #taskTotal = null;
    #heatMap = null;
    #weekdayDist = null;
    #detailRow = null;
    #weekCalendar = null;

    static get htmlPath() {
        return 'stat-container';
    }

    get classAttr() {
        return 'tpl tpl-stat-container';
    }

    async init(userId) {
        const filterForm = this.getElement().querySelector('form[name="stat-filter-form"]');

        this.getElement().querySelector('.stat-nav-tab-general').addEventListener('click', async (event) => {
            if (!event.target.closest('.stat-nav-tab')) return;

            this.getElement().querySelector('.stat-nav-tab-general').classList.add('active');
            this.getElement().querySelector('.stat-nav-tab-detailed').classList.remove('active');

            this.getElement().querySelector('.stat-detailed-row')?.classList.add('d-none');
            this.getElement().querySelector('.tpl-stat-week-calendar')?.classList.add('d-none');
            this.getElement().querySelector('.tpl-stat-task-total')?.classList.remove('d-none');
        });

        this.getElement().querySelector('.stat-nav-tab-detailed').addEventListener('click', async (event) => {
            if (!event.target.closest('.stat-nav-tab')) return;

            this.getElement().querySelector('.stat-nav-tab-general').classList.remove('active');
            this.getElement().querySelector('.stat-nav-tab-detailed').classList.add('active');

            const includeArchived = filterForm.elements['show-archived'].checked;

            if (!this.#detailRow) {
                // The heat map and the weekday distribution live in one
                // row: narrow — stacked in a column, wide — map on the left (fixed),
                // distribution on the right (stretches). The layout is defined by CSS in the fragment.
                this.#detailRow = document.createElement('div');
                this.#detailRow.className = 'stat-detailed-row';
                this.getElement().append(this.#detailRow);

                this.#heatMap = await TplStatHeatMap.create(userId, includeArchived);
                this.#detailRow.append(this.#heatMap.getElement());

                this.#weekdayDist = await TplStatWeekdayDist.create(userId, this.#heatMap.year, includeArchived);
                this.#detailRow.append(this.#weekdayDist.getElement());

                this.#heatMap.setOnYearChanged((year) => this.#weekdayDist.setYear(year));

                this.#weekCalendar = await TplStatWeekCalendar.create(userId, includeArchived);
                this.getElement().append(this.#weekCalendar.getElement());
            }

            this.#detailRow.classList.remove('d-none');
            this.getElement().querySelector('.tpl-stat-week-calendar')?.classList.remove('d-none');
            this.getElement().querySelector('.tpl-stat-task-total')?.classList.add('d-none');
        });

        filterForm.elements['show-archived'].addEventListener('change', async (event) => {
            const includeArchived = event.target.checked;
            await this.#taskTotal?.setIncludeArchived(includeArchived);
            await this.#heatMap?.setIncludeArchived(includeArchived);
            await this.#weekdayDist?.setIncludeArchived(includeArchived);
            await this.#weekCalendar?.setIncludeArchived(includeArchived);
        });

        this.#taskTotal = await TplStatTaskTotal.create(userId);
        this.getElement().append(this.#taskTotal.getElement());
    }
}