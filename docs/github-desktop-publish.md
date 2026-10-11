# Загрузка через GitHub Desktop

## Подключить существующий проект

Репозиторий находится в:

`Z:\YandexDisk\ПетПроекты\АУП\management-compass`

1. Если Desktop пишет **Can't find management-compass**, нажмите **Locate…** и выберите эту папку целиком.
2. Если Locate не помогает: **File → Add Local Repository… → Choose…**, укажите тот же путь, затем **Add Repository**.
3. Убедитесь, что выбран репозиторий `management-compass`, ветка `main` и remote `https://github.com/Altersam/management-compass.git`.

Папка `site/` — результат сборки, не репозиторий. Здесь не нужно создавать новый repository или клонировать GitHub поверх текущих файлов.

## Сохранить и отправить исправления

1. Вкладка **Changes** показывает файлы относительно последнего commit. Если список пуст, проверьте **History**: изменения могли уже быть сохранены и отправлены ранее.
2. Для текущего набора выберите все относящиеся к проекту файлы: новые assets/arcade, trainer.html, каталог, entry, стили, тесты, docs, package/lock и CI.
3. В **Summary** напишите, например: `feat(arcade): complete management trainer collection`.
4. Нажмите **Commit to main**.
5. Нажмите **Push origin**. При необходимости войдите в свой GitHub-аккаунт в Desktop.
6. Откройте **Repository → View on GitHub**, затем вкладку **Actions**. Дождитесь успешного workflow проверки и публикации Pages.
7. На сайте обновите страницу с `Ctrl+F5`; пункт «Игра» должен открыть каталог из 12 тренажёров.

## Если появляется конфликт

Нельзя оставлять внутри JS/HTML строки `<<<<<<<`, `=======`, `>>>>>>>` и считать файл готовым. Они уже ломали запуск общей шапки и новых игр. Разрешите конфликт, проверьте реальное содержимое и выполните команды ниже перед новым commit.

## Локальная проверка

Из этой же папки:

```sh
npm ci
npm test
npm run lint:content
npm run test:browser
npm run test:a11y
npm run build
git diff --check
```

Для Chromium один раз: `npx playwright install chromium`. Browser и a11y suites запускаются последовательно: они используют один локальный сервер.

`node_modules/`, `site/`, результаты тестов и `.git-recovery-backup/` исключены из Git. PDF/PPT и личные записи из браузера не публикуются. Если Desktop не видит диск `Z:`, убедитесь, что он доступен в Проводнике под тем же пользователем Windows и файлы доступны локально, а не только в облаке.
