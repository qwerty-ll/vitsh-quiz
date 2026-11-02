// Куда сохранять результаты. Вставь сюда адрес веб-приложения Google Apps Script (см. quiz/README.md, шаг «Таблица»).
// Пока строка пустая, квиз работает, но результаты никуда не отправляются.
window.QUIZ_ENDPOINT = "https://script.google.com/macros/s/AKfycbzneE8qIdWn8WWvKWKruikCCJ_n8xeV6x-vosuuI04U2-Efs6fK4vQgcEX9o6C2uRli/exec";

// Розыгрыш среди ответивших на все вопросы: ссылка на сообщения сообщества ВК (например https://vk.me/vitsh_media)
// и срок, до которого принимаем коды. Пока vk пустой, кнопка «Отправить код» не показывается — код всё равно виден.
window.QUIZ_PRIZE = { vk: "", until: "6 ноября, 23:59" };
