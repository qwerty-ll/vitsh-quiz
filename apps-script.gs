// Сохранение результатов квиза в Google Таблицу. Вставляется в Расширения → Apps Script этой таблицы
// и публикуется как веб-приложение (доступ: «Все»). Подробно — в quiz/README.md.
//   POST — дописывает строку с результатом;  GET — отдаёт распределение баллов для фразы «лучше, чем у N%».
// Только анонимная статистика: никаких имён и контактов, поэтому таблица не хранит персональные данные.
// «Код» — случайный код попытки: по нему победитель розыгрыша сам напишет в сообщения сообщества.

const SHEET = "Результаты";
const HEADER = ["Время", "Код", "Баллы", "Из", "Попытка", "Секунд", "Ответы (1 — верно)"];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEADER);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // несколько человек могут закончить одновременно
  try {
    const d = JSON.parse(e.postData.contents);
    const answers = String(d.answers || "").replace(/[^01]/g, "").slice(0, 50);
    const code = String(d.code || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 9);
    sheet_().appendRow([
      new Date(),
      code,
      (answers.match(/1/g) || []).length, // баллы считаем по ответам, а не берём на веру
      answers.length,
      Number(d.attempt) || 1,
      Number(d.seconds) || "",
      "'" + answers, // апостроф — чтобы «0101…» не стало числом
    ]);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const values = sheet_().getDataRange().getValues();
  const col = values[0].indexOf("Баллы");
  const hist = new Array(51).fill(0);
  values.slice(1).forEach((r) => { const s = Number(r[col]); if (s >= 0 && s <= 50) hist[s]++; });
  return json_({ count: values.length - 1, hist });
}
