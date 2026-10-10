# Архитектура и переход к v3

Статическое приложение на native ES modules, без runtime-фреймворка и backend. Для разработки нужен Node.js 24+. Скрипты сборки и тестовые entry остаются `.cjs`; публичный JS — `.js` с `import/export`.

## Точки входа

Каждая HTML-страница подключает один `type="module"` из `assets/pages/`:

- home — компактный каталог, прогресс, продолжение;
- lesson — собранный контент → topic schema → `mountLesson`;
- workspace — каталог, рабочие ситуации и дневник;
- chapter — подробная справочная тема;
- reference/adizes — дополнительные материалы;
- support — настройки и эксперименты.

`assets/pages/simulation.js` динамически импортируется только при `#final`. На главной и траектории не загружаются полный справочник, банк вопросов, интерактивы и симуляция. Это проверяет браузерный тест по сетевым запросам.

## Общие сервисы

`store.js`, `course-model.js`, `choices.js`, `experiments.js`, `navigator.js`, `situations-engine.js`, `simulation-engine.js` экспортируют функции явно. Их можно импортировать в Node без DOM. `runtime.js` создаёт одну browser storage instance. Сохранённые compatibility aliases Workspace/WorkspaceUI/CourseModel и CourseUI нужны старым renderer/integrations; они отделены от чистых вычислений.

`activities.js` пока сохраняет десять UI-механик в одном файле. Инстанс имеет `getState`, `evaluate`, `renderFeedback`, `unmount` и временный alias `read`. При смене фазы урок снимает обработчик и размонтирует интерактив. Следующий подэтап — реальные самостоятельные файлы механик, без wrappers вокруг общего switch.

Контент пока импортируется из прежних слоёв через page entry. Глобальные HANDBOOK/COURSE/PEDAGOGY/Visuals/CaseUI остаются переходными зависимостями. Изолированная schema boundary и equivalence tests позволяют переносить их по частям.

## Хранение и миграция

Ключ `management-compass:v1`, envelope version 1 и формат копии version 1 сохраняются. Внутри `data` используется `dataVersion:3`. `migrateProfile()` чистая, идемпотентная, добавляет defaults и сохраняет неизвестные поля. Она применяется при загрузке и проверке импорта. Обязательные поля копии и недопустимые вложенные ключи проверяются до создания нового профиля.

Старые `final`, simulation revision 2, archives, attempts, answers и `legacyCompleted` сохраняются. Новая симуляция должна иметь отдельную revision: прежнюю последовательность нельзя прогонять по новому графу.

## Публичная граница

`scripts/public-files.cjs` — общий allowlist для serve/build. Разрешены HTML-страницы и локальные JS/CSS/SVG/ICO в вложенных assets/content, а также десять modules pages. Непубличные файлы, traversal и symlinks не обслуживаются. Сборка сначала проверяет список и merge markers, затем создаёт `site/`.

Вложенные импорты относительны к файлам модулей, поэтому работают и под GitHub Pages project prefix. CI: npm ci → Node tests → content lint → browser tests → build → artifact → deploy.

## Незавершённый подэтап

Полная миграция авторского контента в `content/topics/`, lazy loading выбранной темы и разделение десяти activities ещё впереди. Accessibility audit с axe, поведенческие механики тем и simulation v3 относятся к следующим этапам. `docs/v3-audit.md` сохраняет исходную линию и риски, а не описывает их как уже реализованные функции.
