// CONFIGURATION
const STAFF_PASS = "Allez";
const WINDOWS = {
  week1: { start: new Date('2026-03-02T00:00:00'), end: new Date('2026-03-08T22:00:00') },
  week2: { start: new Date('2026-03-09T00:00:00'), end: new Date('2026-03-15T22:00:00') }
};

function doGet(e) {
  const action = e.parameter.action;
  const params = e.parameter;
  let result;

  try {
    if (action === 'login') result = loginClimber(params.email, params.pin);
    if (action === 'register') result = registerClimber(params.email, params.name, params.pin, params.optIn);
    if (action === 'saveScore') result = saveScore(params.email, params.idx, params.val);
    if (action === 'leaderboard') result = getLeaderboard();
    if (action === 'verifyIg') result = verifyIg(params.email, params.week, params.pass);
    if (action === 'redeem') result = processRedeem(params.email, params.item, params.cost, params.pass);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function loginClimber(email, pin) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Scores");
  const data = sheet.getDataRange().getValues();
  const emailLower = email.toLowerCase().trim();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toLowerCase() === emailLower) {
      if (!pin) return { needsPin: true };
      if (String(data[i][20]) === String(pin)) return getClimberData(emailLower, data[i], ss);
      return { error: "Wrong PIN." };
    }
  }
  return { isNew: true };
}

function getClimberData(email, userRow, ss) {
  const redeemData = ss.getSheetByName("Redemptions").getDataRange().getValues();
  let myClaims = [];
  let totalSpent = 0;
  for (let j = 1; j < redeemData.length; j++) {
    if (redeemData[j][0].toLowerCase() === email) {
      myClaims.push(`${redeemData[j][1]} (${new Date(redeemData[j][3]).toLocaleDateString()})`);
      totalSpent += Number(redeemData[j][2]);
    }
  }
  let lifetime = 0;
  for (let k = 2; k <= 19; k++) { lifetime += (Number(userRow[k]) || 0); }
  return { name: userRow[1], scores: userRow.slice(2, 18), lifetime, balance: lifetime - totalSpent, claims: myClaims, email };
}

function registerClimber(email, name, pin, optIn) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Scores");
  const newRow = [email.toLowerCase().trim(), name];
  for(let i=2; i<20; i++) newRow.push(0);
  newRow.push(pin);
  newRow.push(optIn === 'true');
  sheet.appendRow(newRow);
  return loginClimber(email, pin);
}

function saveScore(email, idx, val) {
  const now = new Date();
  const week = (idx < 8) ? "week1" : "week2";
  if (now < WINDOWS[week].start || now > WINDOWS[week].end) return { error: "Window Locked" };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Scores");
  const data = sheet.getDataRange().getValues();
  const row = data.findIndex(r => r[0].toLowerCase() === email.toLowerCase()) + 1;
  sheet.getRange(row, parseInt(idx) + 3).setValue(val);
  return { success: true };
}

function getLeaderboard() {
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Scores").getDataRange().getValues();
  let list = [];
  for(let i = 1; i < data.length; i++) {
    if(data[i][21] === true || data[i][21] === "true") {
      let total = 0;
      for(let k=2; k<=19; k++) total += (Number(data[i][k]) || 0);
      list.push({ name: data[i][1], score: total });
    }
  }
  return list.sort((a,b) => b.score - a.score).slice(0, 10);
}

function verifyIg(email, week, pass) {
  if (pass !== STAFF_PASS) return { error: "Wrong Staff Pass" };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Scores");
  const data = sheet.getDataRange().getValues();
  const row = data.findIndex(r => r[0].toLowerCase() === email.toLowerCase()) + 1;
  sheet.getRange(row, (week == 1 ? 19 : 20)).setValue(100);
  return { success: true };
}

function processRedeem(email, item, cost, pass) {
  if (pass !== STAFF_PASS) return { error: "Wrong Staff Pass" };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Redemptions");
  sheet.appendRow([email.toLowerCase(), item, cost, new Date()]);
  return { success: true };
}
