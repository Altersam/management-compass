# Проверка синхрокопий v4

До cleanup: 31 tracked файл с `(2)` в имени. Поиск references/imports в публичных HTML/JS/CSS и просмотр конфигурации сборки/тестов не выявили потребителей синхрокопий. Они уже исключались из публичного allowlist. SHA-256 сравнение: 13 файлов идентичны основным, 18 отличаются.

## Удаляемый отдельный набор

Только побайтово идентичные, неиспользуемые файлы:

- `content (2)/catalog.js`
- `content (2)/legacy-adapter.js`
- `content (2)/misconceptions.js`
- `content (2)/topic-schema.js`
- `playwright.config (2).cjs`
- `scripts/build (2).cjs`
- `scripts/content-audit (2).cjs`
- `scripts/serve (2).cjs`
- `tests/behavior.test (2).cjs`
- `tests/content.test (2).cjs`
- `tests/game.test (2).cjs`
- `tests/learning-practice.test (2).cjs`
- `tests/store.test (2).cjs`

## Сохранённые отличающиеся файлы

`LICENSE (2)`, `adizes-lifecycle (2).html`, `assets/shell (2).css`, package/lock (2), `scripts/check-conflicts (2).cjs`, `scripts/lint-content (2).cjs`, `scripts/public-files (2).cjs`, `settings (2).html`, `sources (2).html`, `workspace (2).html`, `tests/a11y/product.spec (2).cjs`, `tests/architecture.test (2).cjs`, `tests/experience.test (2).cjs`, четыре browser spec (2): course/game/product/reference.

Отличающийся файл нельзя считать идентичным дублем только по имени. Эти 18 файлов сохранены; allowlist по-прежнему не публикует их. Результат проверки воспроизводим командой `node scripts/design-report.cjs --copies` (после удаления выводит оставшиеся файлы). Пустые каталоги Git не отслеживает.

Cleanup должен попасть в отдельный коммит из 13 удалений; интерфейс и форматы данных в него не входят.
