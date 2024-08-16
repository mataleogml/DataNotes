// app.js
import { initUploadForm } from './components/UploadForm.js';
import { initDashboard } from './components/Dashboard.js';
import { initDataStorage } from './services/dataStorage.js';
import { initDocumentBrowser } from './components/DocumentBrowser.js';

async function initApp() {
    try {
        await initDataStorage();
        initUploadForm();  // Make sure this line is present
        initDocumentBrowser();
        initDashboard();
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('There was an error initializing the application. Please refresh the page and try again.');
    }
}

document.addEventListener('DOMContentLoaded', initApp);