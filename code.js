function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle("COMP XP | Boulder Story");
}

function loginClimber(email) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var scoreSheet = ss.getSheetByName("Scores");
  var emailLower = email.toLowerCase().trim();
  var data = scoreSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toLowerCase() === emailLower) {
      return getClimberData(emailLower, data[i], ss); // Returning user
    }
  }
  return { isNew: true }; // New user needs to register
}

function registerClimber(email, name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var scoreSheet = ss.getSheetByName("Scores");
  var newRow = [email.toLowerCase().trim(), name];
  // Fill the rest of the 20 columns with blank/0 so it matches the format
  for(var i=2; i<20; i++) { newRow.push(0); }
  scoreSheet.appendRow(newRow);
  return getClimberData(email.toLowerCase().trim(), newRow, ss);
}

function getClimberData(email, userRow, ss) {
  var redeemSheet = ss.getSheetByName("Redemptions");
  var redeemData = redeemSheet.getDataRange().getValues();
  
  var myClaims = [];
  var totalSpent = 0;
  
  for (var j = 1; j < redeemData.length; j++) {
    if (redeemData[j][0] && redeemData[j][0].toLowerCase() === email) {
      // Create a clean string for the history list
      var dateStr = new Date(redeemData[j][3]).toLocaleDateString();
      myClaims.push(redeemData[j][1] + " (" + dateStr + ")");
      totalSpent += Number(redeemData[j][2]);
    }
  }

  var lifetimeXP = 0;
  // Sum up routes (Index 2-17) and IG Bonuses (Index 18-19)
  for (var k = 2; k <= 19; k++) {
    lifetimeXP += (Number(userRow[k]) || 0);
  }
  
  return {
    isNew: false,
    name: userRow[1],
    scores: userRow.slice(2, 18),
    igW1: userRow[18] || 0,
    igW2: userRow[19] || 0,
    lifetime: lifetimeXP,
    spent: totalSpent,
    balance: lifetimeXP - totalSpent,
    claims: myClaims
  };
}

function saveScore(email, idx, val) {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Scores");
  var data = ss.getDataRange().getValues();
  var row = data.findIndex(r => r[0].toLowerCase() === email.toLowerCase().trim()) + 1;
  if(row > 0) {
    ss.getRange(row, idx + 3).setValue(val);
  }
  return "Saved!";
}

function verifyIg(email, week) {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Scores");
  var data = ss.getDataRange().getValues();
  var row = data.findIndex(r => r[0].toLowerCase() === email.toLowerCase().trim()) + 1;
  var col = (week === 1) ? 19 : 20;
  ss.getRange(row, col).setValue(100);
  return "100 XP Added!";
}

function processRedeem(email, itemName, cost) {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Redemptions");
  ss.appendRow([email.toLowerCase().trim(), itemName, cost, new Date()]);
  return "Successfully claimed: " + itemName;
}
