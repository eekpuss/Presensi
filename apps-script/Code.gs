// Handle preflight request (OPTIONS)
function doOptions(e) {
  // Gunakan ContentService langsung tanpa mencoba menambahkan header CORS
  return ContentService.createTextOutput(JSON.stringify({
    status: "success"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var executionStart = new Date().getTime();
  Logger.log("EXECUTION START: " + new Date().toISOString());
  
  try {
    // Parse request data
    Logger.log("Request Content Type: " + e.contentType);
    Logger.log("Request Parameters: " + JSON.stringify(e.parameter));
    Logger.log("Request Post Data: " + e.postData?.contents);
    
    // Setup key variables
    var params = e.parameter;
    var name = params.name;
    var nik = params.nik;
    var action = params.action;
    
    Logger.log("Extracted Data - Name: " + name + ", NIK: " + nik + ", Action: " + action);
    
    // Access spreadsheet
    try {
      var ss = SpreadsheetApp.openById('1sglCOorlsdJpg29yVvscoOlXaDzjGcVZ47NthPHGLyo');
      Logger.log("Spreadsheet opened: " + ss.getName());
    } catch (ssError) {
      Logger.log("ERROR OPENING SPREADSHEET: " + ssError.message);
      throw new Error("Failed to open spreadsheet: " + ssError.message);
    }
    
    // Access sheet
    try {
      var allSheets = ss.getSheets();
      Logger.log("All sheets in spreadsheet: " + allSheets.map(s => s.getName()).join(", "));
      
      var sheet = ss.getSheetByName("Presensi");
      if (sheet) {
        Logger.log("Successfully accessed 'Presensi' sheet");
      } else {
        Logger.log("Sheet 'Presensi' not found, trying to use active sheet");
        sheet = ss.getActiveSheet();
        Logger.log("Using active sheet: " + sheet.getName());
      }
    } catch (sheetError) {
      Logger.log("ERROR ACCESSING SHEET: " + sheetError.message);
      throw new Error("Failed to access sheet: " + sheetError.message);
    }
    
    // Get current date
    var today = new Date();
    var formattedDate = Utilities.formatDate(today, 'GMT+7', 'yyyy-MM-dd');
    
    // Try to append row
    try {
      // Format data for insertion
      var rowData = [name, nik, action === 'login' ? params.loginTime : '', 
                     action === 'logout' ? params.logoutTime : '', formattedDate];
      
      Logger.log("Attempting to append row with data: " + rowData.join(", "));
      sheet.appendRow(rowData);
      Logger.log("Row successfully appended");
    } catch (appendError) {
      Logger.log("ERROR APPENDING ROW: " + appendError.message + "\n" + appendError.stack);
      throw new Error("Failed to append row: " + appendError.message);
    }
    
    // Return success response
    var executionTime = new Date().getTime() - executionStart;
    Logger.log("EXECUTION COMPLETE: Success in " + executionTime + "ms");
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data berhasil diproses',
      debug: {
        executionTime: executionTime,
        timestamp: new Date().toISOString()
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("FATAL ERROR: " + error.message);
    Logger.log("Stack trace: " + error.stack);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString()
      }
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Simple test function to verify spreadsheet access
function testSpreadsheetAccess() {
  try {
    Logger.log("Starting spreadsheet access test");
    
    var ss = SpreadsheetApp.openById('1sglCOorlsdJpg29yVvscoOlXaDzjGcVZ47NthPHGLyo');
    Logger.log("Spreadsheet opened: " + ss.getName());
    
    var sheets = ss.getSheets();
    Logger.log("Sheets in this spreadsheet: " + sheets.map(s => s.getName()).join(", "));
    
    var activeSheet = ss.getActiveSheet();
    Logger.log("Active sheet: " + activeSheet.getName());
    
    var testRow = ["TEST DATA", "TEST NIK", new Date().toLocaleString(), "", new Date().toISOString().split('T')[0]];
    Logger.log("Attempting to write test row: " + testRow.join(", "));
    
    activeSheet.appendRow(testRow);
    Logger.log("Test row successfully added!");
    
    // Check if row was actually written
    var lastRow = activeSheet.getLastRow();
    var lastRowData = activeSheet.getRange(lastRow, 1, 1, 5).getValues()[0];
    Logger.log("Verification - last row contains: " + lastRowData.join(", "));
    
    return "Test completed successfully. Check logs for details.";
  } catch (error) {
    Logger.log("TEST ERROR: " + error.message);
    Logger.log("Stack trace: " + error.stack);
    return "Test failed: " + error.message;
  }
}

// Handle GET requests
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Endpoint aktif'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Fungsi untuk memproses login
function processLogin(sheet, data) {
  // Dapatkan tanggal hari ini
  const today = new Date();
  const formattedDate = Utilities.formatDate(today, 'GMT+7', 'yyyy-MM-dd');
  
  // Cek apakah karyawan sudah login hari ini
  const lastRow = sheet.getLastRow();
  let alreadyLoggedIn = false;
  
  if (lastRow > 1) {
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 5); // Nama, NIK, Login, Logout, Tanggal
    const values = dataRange.getValues();
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      // Cek apakah NIK sama dan tanggal sama (sudah login hari ini)
      if (row[1] === data.nik && row[4] === formattedDate && !row[3]) {
        alreadyLoggedIn = true;
        break;
      }
    }
  }
  
  if (alreadyLoggedIn) {
    throw new Error('Anda sudah login hari ini');
  }
  
  // Tambahkan data login baru
  sheet.appendRow([
    data.name,
    data.nik,
    data.loginTime,
    '', // Logout time masih kosong
    formattedDate
  ]);
}

// Fungsi untuk memproses logout
function processLogout(sheet, data) {
  // Dapatkan tanggal hari ini
  const today = new Date();
  const formattedDate = Utilities.formatDate(today, 'GMT+7', 'yyyy-MM-dd');
  
  // Cari record login karyawan hari ini
  const lastRow = sheet.getLastRow();
  let foundRow = -1;
  
  if (lastRow > 1) {
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 5); // Nama, NIK, Login, Logout, Tanggal
    const values = dataRange.getValues();
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      // Cek apakah NIK sama, tanggal sama, dan belum logout (kolom logout kosong)
      if (row[1] === data.nik && row[4] === formattedDate && !row[3]) {
        foundRow = i + 2; // +2 karena index dimulai dari 0 dan header di baris 1
        break;
      }
    }
  }
  
  if (foundRow === -1) {
    // Jika tidak ditemukan record login, langsung buat record baru dengan logout saja
    // Untuk mengakomodasi kasus khusus atau shift malam
    sheet.appendRow([
      data.name,
      data.nik,
      '', // Login time kosong
      data.logoutTime,
      formattedDate
    ]);
  } else {
    // Update record yang sudah ada dengan waktu logout
    sheet.getRange(foundRow, 4).setValue(data.logoutTime);
  }
}

// Fungsi untuk mengirim data ke Google Sheet
function sendDataToSheet(data) {
    // Tampilkan loading state
    const activeBtn = data.action === 'login' ? loginBtn : logoutBtn;
    activeBtn.disabled = true;
    activeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Buat form data untuk mengirim secara tradisional
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = scriptURL;
    form.target = '_blank'; // Buka di tab baru (opsional)
    form.style.display = 'none';
    
    // Tambahkan data sebagai input hidden
    for (const key in data) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
    }
    
    // Tambahkan form ke body dan submit
    document.body.appendChild(form);
    form.submit();
    
    // Hapus form setelah submit
    setTimeout(() => {
        document.body.removeChild(form);
        
        // Reset button state
        activeBtn.disabled = false;
        activeBtn.innerHTML = data.action === 'login' ? 
            '<i class="fas fa-sign-in-alt"></i> Login' : 
            '<i class="fas fa-sign-out-alt"></i> Logout';
        
        // Tampilkan pesan sukses (asumsi berhasil)
        showStatus(`${data.action === 'login' ? 'Login' : 'Logout'} berhasil dikirim!`, 'success');
        
        // Reset form setelah berhasil logout
        if (data.action === 'logout') {
            setTimeout(() => {
                nameInput.value = '';
                nikInput.value = '';
            }, 2000);
        }
    }, 3000);
}

// Fungsi untuk mendapatkan data presensi (bisa digunakan untuk dashboard/reporting)
function getAttendanceData() {
  const ss = SpreadsheetApp.openById('1sglCOorlsdJpg29yVvscoOlXaDzjGcVZ47NthPHGLyo');
  const sheet = ss.getSheetByName('Presensi');
  
  if (!sheet) {
    return {
      success: false,
      error: 'Sheet tidak ditemukan'
    };
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return {
      success: true,
      data: []
    };
  }
  
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 5);
  const values = dataRange.getValues();
  
  const attendanceData = values.map(row => ({
    name: row[0],
    nik: row[1],
    loginTime: row[2],
    logoutTime: row[3],
    date: row[4]
  }));
  
  return {
    success: true,
    data: attendanceData
  };
}

// Fungsi untuk membuat web app dapat diakses oleh siapa saja
function setup() {
  ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  PropertiesService.getScriptProperties().setProperty('SETUP_DONE', 'true');
  Logger.log('Setup selesai');
}