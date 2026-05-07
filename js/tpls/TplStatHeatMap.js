import Tpl from './Tpl.js';

export default class TplStatHeatMap extends Tpl {
    static get htmlPath() {
        return 'stat-heat-map';
    }
    
    get classAttr() {
        return 'tpl tpl-stat-heat-map';
    }
    
    async init(userId) {
        const MN = ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'];
        const DN = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];
        let year = new Date().getFullYear();
        const CELL = 14, GAP = 3, STEP = 17;

        function render() {
            document.getElementById('yd').textContent = year;
            const weeks = buildCal(year);
            const wr = document.getElementById('wr');
            const ml = document.getElementById('ml');
            wr.innerHTML = '';
            ml.innerHTML = '';

            let lastMonth = -1;
            weeks.forEach((week, wi) => {
                for (let di = 0; di < 7; di++) {
                    const d = week[di];
                    if (d.getFullYear() === year && d.getMonth() !== lastMonth) {
                        lastMonth = d.getMonth();
                        const lbl = document.createElement('div');
                        lbl.className = 'mlabel';
                        lbl.style.left = (wi * STEP) + 'px';
                        lbl.textContent = MN[lastMonth];
                        ml.appendChild(lbl);
                        break;
                    }
                }
                const col = document.createElement('div');
                col.className = 'wcol';
                week.forEach(d => {
                    const cell = document.createElement('div');
                    if (d.getFullYear() !== year) {
                        cell.className = 'day empty';
                    } else {
                        cell.className = 'day';
                        cell.title = `${DN[d.getDay()]}, ${d.getDate()} ${MN[d.getMonth()]} ${year}`;
                    }
                    col.appendChild(cell);
                });
                wr.appendChild(col);
            });
        }

        function buildCal(y) {
            const jan1 = new Date(y, 0, 1);
            const dow = jan1.getDay();
            const startOff = dow === 0 ? 6 : dow - 1;
            const start = new Date(jan1);
            start.setDate(start.getDate() - startOff);

            const dec31 = new Date(y, 11, 31);
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

        setTimeout(() => {
            render();
            document.getElementById('bp').addEventListener('click', () => { year--; render(); });
            document.getElementById('bn').addEventListener('click', () => { year++; render(); });
        });
    }
}