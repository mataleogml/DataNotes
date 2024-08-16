// components/UploadForm.js
import { processRawData } from '../services/dataProcessing.js';
import { saveDataPoints, saveRawDocument } from '../services/dataStorage.js';

export function initUploadForm() {
    console.log('Initializing upload form');
    const uploadForm = document.createElement('form');
    uploadForm.innerHTML = `
        <input type="file" id="file-upload" accept=".txt,.csv" class="mb-2">
        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Upload</button>
    `;
    
    uploadForm.addEventListener('submit', handleUpload);
    
    const uploadFormContainer = document.getElementById('upload-form');
    if (uploadFormContainer) {
        uploadFormContainer.appendChild(uploadForm);
        console.log('Upload form appended to DOM');
    } else {
        console.error('Upload form container not found in DOM');
    }
}

async function handleUpload(event) {
    console.log('Handle upload function called');
    event.preventDefault();
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    
    if (file) {
        console.log(`File selected: ${file.name}`);
        try {
            console.log('Reading file contents');
            const rawData = await file.text();
            console.log('File contents read successfully. First 100 characters:', rawData.substring(0, 100));

            console.log('Processing raw data');
            const documentId = `doc-${Date.now()}`;
            const dataPoints = await processRawData(rawData, documentId, file.name);
            console.log(`Processed ${dataPoints.length} data points:`, dataPoints);

            console.log('Saving raw document');
            await saveRawDocument({
                id: documentId,
                name: file.name,
                content: rawData,
                timestamp: new Date().toISOString()
            });
            console.log('Raw document saved successfully');

            console.log('Saving data points');
            await saveDataPoints(dataPoints);
            console.log('Data points saved successfully');

            console.log('Dispatching update events');
            document.dispatchEvent(new CustomEvent('dataUpdated'));
            document.dispatchEvent(new CustomEvent('documentsUpdated'));
            console.log('Update events dispatched');

            alert('Document uploaded and processed successfully!');
        } catch (error) {
            console.error('Error during upload process:', error);
            alert(`An error occurred while processing the file: ${error.message}`);
        }
    } else {
        console.warn('No file selected for upload');
        alert('Please select a file to upload.');
    }
}