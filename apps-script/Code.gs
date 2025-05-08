// Handle preflight request (OPTIONS)
function doOptions(e) {
  // Gunakan ContentService langsung tanpa mencoba menambahkan header CORS
  return ContentService.createTextOutput(JSON.stringify({
    status: "success"
  })).setMimeType(ContentService.MimeType.JSON);
}

// Fungsi utama untuk memproses permintaan POST
function doPost(e) {
  var executionStart = new Date().getTime();
  Logger.log("EXECUTION START: " + new Date().toISOString());
  
  try {
    // Log detail request untuk debugging
    Logger.log("Request Content Type: " + e.contentType);
    Logger.log("Request Parameters: " + JSON.stringify(e.parameter || {}));
    Logger.log("Request Post Data: " + (e.postData?.contents || "None"));
    
    // Inisialisasi data dari berbagai kemungkinan sumber
    var data;
    
    // Coba ekstrak data dari berbagai format
    if (e.postData && e.postData.contents) {
      try {
        // Coba parse sebagai JSON
        data = JSON.parse(e.postData.contents);
        Logger.log("Berhasil parse JSON: " + JSON.stringify(data));
      } catch (jsonError) {
        Logger.log("Gagal parse sebagai JSON, mungkin form data: " + jsonError.message);
        // Jika bukan JSON, gunakan form data dari parameter
        data = e.parameter || {};
      }
    } else {
      // Gunakan parameter object jika tidak ada postData
      data = e.parameter || {};
      Logger.log("Menggunakan data parameter: " + JSON.stringify(data));
    }
    
    // Ekstrak informasi penting
    var name = data.name;
    var nik = data.nik;
    var action = data.action;
    
    Logger.log("Data yang diekstrak - Name: " + name + ", NIK: " + nik + ", Action: " + action);
    
    // Validasi data yang diperlukan
    if (!name || !nik || !action) {
      throw new Error("Data tidak lengkap. Name: " + name + ", NIK: " + nik + ", Action: " + action);
    }
    
    // Akses spreadsheet dengan penanganan error yang lebih baik
    var ss;
    try {
      ss = SpreadsheetApp.openById('1sglCOorlsdJpg29yVvscoOlXaDzjGcVZ47NthPHGLyo');
      Logger.log("Spreadsheet dibuka: " + ss.getName());
    } catch (ssError) {
      Logger.log("ERROR MEMBUKA SPREADSHEET: " + ssError.message);
      throw new Error("Gagal membuka spreadsheet: " + ssError.message);
    }
    
    // Daftar semua sheet untuk debugging
    var allSheets = ss.getSheets();
    Logger.log("Semua sheet dalam spreadsheet: " + allSheets.map(s => s.getName()).join(", "));
    
    // Akses atau buat sheet Presensi dengan penanganan error yang lebih baik
    var sheet;
    try {
      sheet = ss.getSheetByName("Presensi");
      if (sheet) {
        Logger.log("Menggunakan sheet 'Presensi'");
      } else {
        Logger.log("Sheet 'Presensi' tidak ditemukan, membuatnya");
        sheet = ss.insertSheet("Presensi");
        // Tambahkan header jika ini sheet baru
        sheet.appendRow(["Nama", "NIK", "Login Time", "Logout Time", "Tanggal"]);
        Logger.log("Sheet 'Presensi' berhasil dibuat dengan header");
      }
    } catch (sheetError) {
      Logger.log("ERROR MENGAKSES SHEET: " + sheetError.message);
      throw new Error("Gagal mengakses sheet: " + sheetError.message);
    }
    
    // Dapatkan tanggal saat ini
    var today = new Date();
    var formattedDate = Utilities.formatDate(today, 'GMT+7', 'yyyy-MM-dd');
    
    // Proses data berdasarkan tipe action
    try {
      if (action === 'login') {
        // Proses login
        var loginTime = data.loginTime || today.toLocaleString('id-ID');
        
        // Cek apakah sudah login hari ini
        var lastRow = sheet.getLastRow();
        var alreadyLoggedIn = false;
        
        if (lastRow > 1) {
          var dataRange = sheet.getRange(2, 1, lastRow - 1, 5);
          var values = dataRange.getValues();
          
          for (var i = 0; i < values.length; i++) {
            var row = values[i];
            if (row[1] === nik && row[4] === formattedDate && !row[3]) {
              alreadyLoggedIn = true;
              break;
            }
          }
        }
        
        if (!alreadyLoggedIn) {
          // Tambahkan data login baru
          var rowData = [name, nik, loginTime, '', formattedDate];
          Logger.log("Menambahkan data login: " + rowData.join(", "));
          sheet.appendRow(rowData);
          Logger.log("Data login berhasil ditambahkan");
        } else {
          Logger.log("Karyawan sudah login hari ini");
        }
      } else if (action === 'logout') {
        // Proses logout
        var logoutTime = data.logoutTime || today.toLocaleString('id-ID');
        
        // Cari record login karyawan hari ini
        var lastRow = sheet.getLastRow();
        var foundRow = -1;
        
        if (lastRow > 1) {
          var dataRange = sheet.getRange(2, 1, lastRow - 1, 5);
          var values = dataRange.getValues();
          
          for (var i = 0; i < values.length; i++) {
            var row = values[i];
            if (row[1] === nik && row[4] === formattedDate && !row[3]) {
              foundRow = i + 2; // +2 karena index dimulai dari 0 dan header di baris 1
              break;
            }
          }
        }
        
        if (foundRow === -1) {
          // Jika tidak ada record login, buat record baru dengan logout saja
          var rowData = [name, nik, '', logoutTime, formattedDate];
          Logger.log("Menambahkan data logout baru: " + rowData.join(", "));
          sheet.appendRow(rowData);
          Logger.log("Data logout baru berhasil ditambahkan");
        } else {
          // Update record yang ada dengan waktu logout
          Logger.log("Mengupdate record yang ada di baris " + foundRow + " dengan waktu logout: " + logoutTime);
          sheet.getRange(foundRow, 4).setValue(logoutTime);
          Logger.log("Data logout berhasil diupdate");
        }
      } else {
        throw new Error("Action tidak valid: " + action);
      }
    } catch (processError) {
      Logger.log("ERROR MEMPROSES DATA: " + processError.message);
      throw new Error("Gagal memproses data: " + processError.message);
    }
    
    // Return success response
    var executionTime = new Date().getTime() - executionStart;
    Logger.log("EKSEKUSI SELESAI: Berhasil dalam " + executionTime + "ms");
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data berhasil diproses',
      debug: {
        executionTime: executionTime,
        timestamp: new Date().toISOString()
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("ERROR FATAL: " + error.message);
    Logger.log("Stack trace: " + (error.stack || "Tidak ada stack trace"));
    
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
    
    // Coba gunakan sheet Presensi atau buat jika belum ada
    var sheet = ss.getSheetByName("Presensi");
    if (!sheet) {
      Logger.log("Sheet 'Presensi' tidak ditemukan, membuatnya");
      sheet = ss.insertSheet("Presensi");
      sheet.appendRow(["Nama", "NIK", "Login Time", "Logout Time", "Tanggal"]);
      Logger.log("Sheet 'Presensi' berhasil dibuat dengan header");
    } else {
      Logger.log("Using sheet: " + sheet.getName());
    }
    
    var testRow = ["TEST DATA", "TEST NIK", new Date().toLocaleString(), "", new Date().toISOString().split('T')[0]];
    Logger.log("Attempting to write test row: " + testRow.join(", "));
    
    sheet.appendRow(testRow);
    Logger.log("Test row successfully added!");
    
    // Check if row was actually written
    var lastRow = sheet.getLastRow();
    var lastRowData = sheet.getRange(lastRow, 1, 1, 5).getValues()[0];
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
  if (e && e.parameter && e.parameter.action === "diagnostics") {
    return ContentService.createTextOutput(runDiagnostics())
      .setMimeType(ContentService.MimeType.TEXT);
  } else {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Endpoint aktif. Gunakan ?action=diagnostics untuk menjalankan diagnostik.'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi untuk menjalankan diagnostik menyeluruh
function runDiagnostics() {
  try {
    Logger.log("Menjalankan diagnostik...");
    
    // Test 1: Akses spreadsheet
    var ss = SpreadsheetApp.openById('1sglCOorlsdJpg29yVvscoOlXaDzjGcVZ47NthPHGLyo');
    Logger.log("Test 1: Berhasil mengakses spreadsheet - " + ss.getName());
    
    // Test 2: Daftar semua sheet
    var sheets = ss.getSheets();
    Logger.log("Test 2: Daftar sheet - " + sheets.map(s => s.getName()).join(", "));
    
    // Test 3: Cek atau buat sheet Presensi
    var presensiSheet = ss.getSheetByName("Presensi");
    if (!presensiSheet) {
      Logger.log("Test 3: Sheet Presensi tidak ditemukan, membuatnya");
      presensiSheet = ss.insertSheet("Presensi");
      presensiSheet.appendRow(["Nama", "NIK", "Login Time", "Logout Time", "Tanggal"]);
      Logger.log("Test 3: Sheet Presensi berhasil dibuat dengan header");
    } else {
      Logger.log("Test 3: Sheet Presensi ditemukan");
    }
    
    // Test 4: Tulis data test
    var testData = ["TEST DIAGNOSTIK", "DIAG-" + new Date().getTime(), 
                   new Date().toLocaleString('id-ID'), "", 
                   Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd')];
    
    presensiSheet.appendRow(testData);
    Logger.log("Test 4: Berhasil menulis data test - " + testData.join(", "));
    
    // Test 5: Verifikasi data tertulis
    var lastRow = presensiSheet.getLastRow();
    var lastRowData = presensiSheet.getRange(lastRow, 1, 1, 5).getValues()[0];
    Logger.log("Test 5: Verifikasi baris terakhir - " + lastRowData.join(", "));
    
    // Test 6: Simulasi doPost
    var mockPostData = {
      parameter: {
        name: "USER SIMULASI",
        nik: "SIM-" + new Date().getTime(),
        action: "login",
        loginTime: new Date().toLocaleString('id-ID')
      }
    };
    
    Logger.log("Test 6: Simulasi doPost dengan data - " + JSON.stringify(mockPostData.parameter));
    var response = doPost(mockPostData);
    Logger.log("Test 6: Hasil simulasi doPost - " + response.getContent());
    
    return "Diagnostik selesai. Lihat log untuk detail.";
  } catch (error) {
    Logger.log("ERROR DIAGNOSTIK: " + error.message);
    Logger.log("Stack trace: " + error.stack);
    return "Diagnostik gagal: " + error.message;
  }
}

// Fungsi untuk setup aplikasi
function setup() {
  ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Pastikan spreadsheet dan sheet Presensi ada
  try {
    var ss = SpreadsheetApp.openById('1sglCOorlsdJpg29yVvscoOlXaDzjGcVZ47NthPHGLyo');
    var sheet = ss.getSheetByName("Presensi");
    
    if (!sheet) {
      sheet = ss.insertSheet("Presensi");
      sheet.appendRow(["Nama", "NIK", "Login Time", "Logout Time", "Tanggal"]);
      Logger.log("Sheet Presensi dibuat dengan header");
    }
    
    PropertiesService.getScriptProperties().setProperty('SETUP_DONE', 'true');
    Logger.log('Setup selesai');
    
    return "Setup berhasil. Spreadsheet dan sheet Presensi siap digunakan.";
  } catch (error) {
    Logger.log("ERROR SETUP: " + error.message);
    return "Setup gagal: " + error.message;
  }
}