import Tpl from './Tpl.js';
import TplStatTaskTotal from './TplStatTaskTotal.js';
import TplStatHeatMap from './TplStatHeatMap.js';

export default class TplStatContainer extends Tpl {
    static get htmlPath() {
        return 'stat-container';
    }
    
    get classAttr() {
        return 'tpl tpl-stat-container';
    }
    
    async init(userId) {
        this.getElement().querySelector('.stat-nav-tab-general').addEventListener('click', async (event) => {
            if (!event.target.closest('.stat-nav-tab')) return;

            this.getElement().querySelector('.stat-nav-tab-general').classList.add('active');
            this.getElement().querySelector('.stat-nav-tab-detailed').classList.remove('active');

            this.getElement().querySelector('.tpl-stat-heat-map')?.classList.add('d-none');
            this.getElement().querySelector('.tpl-stat-task-total')?.classList.remove('d-none');
            
            if (!this.getElement().querySelector('.tpl-stat-task-total')) {
                const tpl = await TplStatTaskTotal.create(userId);
                this.getElement().append(tpl.getElement());
            }
        });

        this.getElement().querySelector('.stat-nav-tab-detailed').addEventListener('click', async (event) => {
            if (!event.target.closest('.stat-nav-tab')) return;

            this.getElement().querySelector('.stat-nav-tab-general').classList.remove('active');
            this.getElement().querySelector('.stat-nav-tab-detailed').classList.add('active');

            this.getElement().querySelector('.tpl-stat-heat-map')?.classList.remove('d-none');
            this.getElement().querySelector('.tpl-stat-task-total')?.classList.add('d-none');
            
            if (!this.getElement().querySelector('.tpl-stat-heat-map')) {
                const tpl = await TplStatHeatMap.create(userId);
                this.getElement().append(tpl.getElement());
            }
        });

        const tpl = await TplStatTaskTotal.create(userId);
        this.getElement().append(tpl.getElement());
    }
}