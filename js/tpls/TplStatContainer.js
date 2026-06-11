import Tpl from './Tpl.js';
import TplStatTaskTotal from './TplStatTaskTotal.js';
import TplStatHeatMap from './TplStatHeatMap.js';
import TplStatWeekCalendar from './TplStatWeekCalendar.js';

export default class TplStatContainer extends Tpl {
    #taskTotal = null;
    #heatMap = null;
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

            this.getElement().querySelector('.tpl-stat-heat-map')?.classList.add('d-none');
            this.getElement().querySelector('.tpl-stat-week-calendar')?.classList.add('d-none');
            this.getElement().querySelector('.tpl-stat-task-total')?.classList.remove('d-none');
        });

        this.getElement().querySelector('.stat-nav-tab-detailed').addEventListener('click', async (event) => {
            if (!event.target.closest('.stat-nav-tab')) return;

            this.getElement().querySelector('.stat-nav-tab-general').classList.remove('active');
            this.getElement().querySelector('.stat-nav-tab-detailed').classList.add('active');

            this.getElement().querySelector('.tpl-stat-heat-map')?.classList.remove('d-none');
            this.getElement().querySelector('.tpl-stat-week-calendar')?.classList.remove('d-none');
            this.getElement().querySelector('.tpl-stat-task-total')?.classList.add('d-none');

            const includeArchived = filterForm.elements['show-archived'].checked;

            if (!this.#heatMap) {
                this.#heatMap = await TplStatHeatMap.create(userId, includeArchived);
                this.getElement().append(this.#heatMap.getElement());
            }

            if (!this.#weekCalendar) {
                this.#weekCalendar = await TplStatWeekCalendar.create(userId, includeArchived);
                this.getElement().append(this.#weekCalendar.getElement());
            }
        });

        filterForm.elements['show-archived'].addEventListener('change', async (event) => {
            const includeArchived = event.target.checked;
            await this.#taskTotal?.setIncludeArchived(includeArchived);
            await this.#heatMap?.setIncludeArchived(includeArchived);
            await this.#weekCalendar?.setIncludeArchived(includeArchived);
        });

        this.#taskTotal = await TplStatTaskTotal.create(userId);
        this.getElement().append(this.#taskTotal.getElement());
    }
}