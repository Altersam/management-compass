# «Спринт: цель вместо скорости» — planning board

## Модель до правок

11 октября 2026, main `647fa6b`, дерево чистое. Прочитаны sprint.js, общая ui.js, arcade engine/browser tests и каталог.

20 исходных задач, goals intake/quality/delivery, points/value/risk/dependency; capacity 18, WIP 1/2/3/5. Engine обрабатывает selected по порядку, учитывает dependency и seeded риск, завершает до трёх спринтов. Незавершённые попадают в carry и автоматически становятся selected следующего плана. Review содержит done count/points/value/goalValue/blocked/WIP. Cumulative points служит прежней метрикой velocity; отдельного поля velocity в исходном create нет.

Все create/act/validate/backlog/goals/report и seeded расчёты сохраняются. UI selection, лимит видимых backlog cards и переход review → planning локальны. Старые revision 1 saves не мигрируют.

## Review-группы без выдуманных причин

Идентификаторы готовых задач каждого review восстанавливаются из последовательности s.done и сохранённых r.done. Незавершённые уже записаны в r.blocked. «Заблокировано» — задача, у которой на момент этого review ещё не завершена зависимость. Остальные показаны как «Перенесено», без утверждения, что причина точно capacity или risk: старый engine не сохраняет отдельный cause. Это не меняет carry или симуляцию и не требует повторного расходования RNG.

## Реализация и аудит

`sprint-board.js` — локальная доска через существующий mountUI. Три цели — крупные selectable rows. Первые десять доступных задач сортируются по связи с целью и доступности; остальные явно доступны через «Ещё задачи». Порядок выполнения selected не сортируется renderer: он остаётся выбором игрока и важен для dependency.

Desktop: backlog слева, выбранный спринт справа. Карточки имеют короткие points/value/goal/dependency. Перенос работает Pointer Events drag и кнопкой «В спринт / В backlog»; переполнение 18 points видно, но не блокирует запуск. WIP выбирается кнопками 1/2/3/5 без раскрытия формулы.

После запуска backlog скрыт; review показывает «Готово / Перенесено / Заблокировано», вклад в цель крупнее velocity. «Планировать следующий» не очищает engine carry: selected уже содержит перенос. После reload последнего sprint-action снова показывается review, а следующий planning восстанавливает тот же carry. UI-этап и limit не требуют новых persisted полей.

Финал содержит три review и реальные points/goalValue/переносы; максимальная velocity не награждается. Старые review без отдельных причин незавершения не получают выдуманную причинную диагностику.

Проверки итогового набора: **150 Node / 101 browser / 28 a11y**, lint/build/diff успешны. Существующая симуляция и engine tests сохранены. Проверены dependency order, capacity, WIP penalty, carry, три спринта, cumulative goal/total value/points/spill, old saves/backup, pointer и keyboard fallback, mobile и доступность review в обеих темах.

Просмотрены `sprint-redesign-{1440|390}.png`, `sprint-final-{1440|390}.png` в `C:\Users\alter\AppData\Local\Temp\opencode`. Большой backlog остаётся списком реальных объектов; все 20 не помещаются в первый экран. Это visual audit без pixel-perfect gate и без реального пользовательского исследования.
