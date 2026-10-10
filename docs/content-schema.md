# Схема содержимого v3

Контракт задаёт `content/topic-schema.js`, taxonomy — `content/misconceptions.js`. Валидатор возвращает массив ошибок с путями к полям. Он не исправляет авторские данные автоматически.

## Объект темы

`schemaVersion: 3`, неизменный числовой `id` (1–10), `title`, `scene: {title, lead}`, `activity: {kind}`, `bridge`.

Массивы: `concepts`, `misconceptions`, `explanations`, `techniques`, `cases`, `questions`, `retrievalQuestions`, `navigatorSignals`, `requiredBehavior`, `incentives`, `informalActors`, `functionNeeds`, `simulationHooks`, `references`.

Объяснение: `title`, `story`, `explain`, `term` и `micro`. Микровопрос имеет стабильный ID, номер темы и блока. Техника сохраняет существующий ID, назначение, шаги, пример, ошибку, проверку и поля рабочей формы.

## Варианты и продуктивные ответы

Вариант — `{text, appeal, analysis, misconception?}`. `answer` — канонический индекс, не позиция на экране. Показ перемешивается отдельно в `course.optionOrders`; ID старого вопроса и индексы не меняются при редактуре.

Вопрос с `kind: 'productive'` имеет `prompt`, `criteria` и `example`. Критерии и пример нужны для самопроверки; схема не предполагает автоматической оценки текста.

Справочный кейс нормализуется в такой же массив вариантов. Параллельные legacy arrays `options/appeals/feedback` создаёт адаптер только для прежнего renderer.

## Текущая граница миграции

`content/legacy-adapter.js` принимает собранные старые `handbook/course/pedagogy` и возвращает schema objects. Учебный renderer уже получает один объект темы через `mountLesson({topic})`. Тест проверяет обратное преобразование в прежние views без потери текстов, IDs и индексов.

Авторские тексты пока остаются в семи старых файлах `assets/content.js` … revisions. Перенос в десять авторских `content/topics/*.js`, заполнение поведенческих полей и удаление legacy layers — следующий подэтап. Наличие adapter не означает завершённую консолидацию источников.

`reference` и `course` в промежуточном объекте — сохранённые projections старого справочника и учебных метаданных. Новые поля не следует добавлять туда как второй источник истины.

## Проверка

```sh
npm run lint:content
npm run lint:content -- --report
```

Ошибки IDs, ссылок, объяснений, вариантов и путей импорта блокируют CI. Длина правильных ответов и распределение позиций проверяются по всему банку. Точные/близкие повторы и generic appeals выводятся для редактора. На этапе compatibility старые варианты ещё допускаются без misconception; строгий режим `validateTopics(topics, {requireMisconceptions:true})` используется после разметки банка.
