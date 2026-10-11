# «Спринт: цель вместо скорости» — planning board

## Модель до правок

11 октября 2026, main `647fa6b`, дерево чистое. Прочитаны sprint.js, общая ui.js, arcade engine/browser tests и каталог.

20 исходных задач, goals intake/quality/delivery, points/value/risk/dependency; capacity 18, WIP 1/2/3/5. Engine обрабатывает selected по порядку, учитывает dependency и seeded риск, завершает до трёх спринтов. Незавершённые попадают в carry и автоматически становятся selected следующего плана. Review содержит done count/points/value/goalValue/blocked/WIP. Cumulative points служит прежней метрикой velocity; отдельного поля velocity в исходном create нет.

Все create/act/validate/backlog/goals/report и seeded расчёты сохраняются. UI selection, лимит видимых backlog cards и переход review → planning локальны. Старые revision 1 saves не мигрируют.

## Review-группы без выдуманных причин

Идентификаторы готовых задач каждого review восстанавливаются из последовательности s.done и сохранённых r.done. Незавершённые уже записаны в r.blocked. «Заблокировано» — задача, у которой на момент этого review ещё не завершена зависимость. Остальные показаны как «Перенесено», без утверждения, что причина точно capacity или risk: старый engine не сохраняет отдельный cause. Это не меняет carry или симуляцию и не требует повторного расходования RNG.
