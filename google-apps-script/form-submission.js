// Replace with your Google Sheet ID
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
const SHEET_NAME = 'Form Submissions';

/**
 * Handles HTTP POST requests to the web app
 */
function doPost(e) {
  try {
    // Parse the form data
    const data = JSON.parse(e.postData.contents);
    
    // Open the Google Sheet
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Add headers
      sheet.appendRow(['Timestamp', 'Name', 'Contact Number', 'Message']);
    }
    
    // Add the form data to the sheet
    const timestamp = new Date();
    sheet.appendRow([
      timestamp,
      data.name,
      data.phone,
      data.message
    ]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Form submitted successfully!'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Creates a menu item to set up the sheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Form Setup')
    .addItem('Initialize Sheet', 'setupSheet')
    .addToUi();
}

/**
 * Sets up the sheet with headers
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  
  // Clear existing data
  sheet.clear();
  
  // Add headers
  sheet.appendRow(['Timestamp', 'Name', 'Contact Number', 'Message']);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, 4);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f0f0f0');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 4);
  
  SpreadsheetApp.getUi().alert('Sheet initialized successfully!');
}
