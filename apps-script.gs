// Сохранение результатов квиза в Google Таблицу. Вставляется в Расширения → Apps Script этой таблицы
// и публикуется как веб-приложение (доступ: «Все»). Подробно — в quiz/README.md.
//   POST — дописывает строку с результатом;  GET — отдаёт распределение баллов для фразы «лучше, чем у N%».

const SHEET = "Результаты";
// Только анонимная статистика: никаких имён и контактов, поэтому таблица не хранит персональные данные.
const HEADER = ["Время", "Баллы", "Из", "Попытка", "Секунд", "Ответы (1 — верно)"];

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
    const score = Math.max(0, Math.min(Number(d.total) || 10, Number(d.score) || 0));
    sheet_().appendRow([
      new Date(),
      score,
      Number(d.total) || 10,
      Number(d.attempt) || 1,
      Number(d.seconds) || "",
      "'" + String(d.answers || "").replace(/[^01]/g, "").slice(0, 20), // апостроф — чтобы «0101…» не стало числом
    ]);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const hist = new Array(11).fill(0);
  rows.forEach((r) => { const s = Number(r[1]); if (s >= 0 && s <= 10) hist[s]++; });
  return json_({ count: rows.length, hist });
}
