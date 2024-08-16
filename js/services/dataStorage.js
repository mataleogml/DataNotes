// services/dataStorage.js

let db;

export async function initDataStorage() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DataNotesDB', 2);
        
        request.onerror = () => reject('Error opening database');
        
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('dataPoints')) {
                db.createObjectStore('dataPoints', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('groups')) {
                db.createObjectStore('groups', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('rawDocuments')) {
                db.createObjectStore('rawDocuments', { keyPath: 'id' });
            }
        };
    });
}

export async function saveRawDocument(document) {
    const transaction = db.transaction(['rawDocuments'], 'readwrite');
    const store = transaction.objectStore('rawDocuments');
    await store.put(document);
}

export async function getRawDocuments() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['rawDocuments'], 'readonly');
        const store = transaction.objectStore('rawDocuments');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = reject;
    });
}

export async function deleteRawDocument(id) {
    const transaction = db.transaction(['rawDocuments', 'dataPoints'], 'readwrite');
    const rawDocStore = transaction.objectStore('rawDocuments');
    const dataPointStore = transaction.objectStore('dataPoints');

    await rawDocStore.delete(id);

    // Delete associated data points
    const dataPoints = await getDataPoints();
    const promises = dataPoints
        .filter(dp => dp.documentId === id)
        .map(dp => dataPointStore.delete(dp.id));
    
    await Promise.all(promises);
}

export async function saveDataPoints(dataPoints) {
    const transaction = db.transaction(['dataPoints'], 'readwrite');
    const store = transaction.objectStore('dataPoints');
    
    for (const dataPoint of dataPoints) {
        store.put(dataPoint);
    }
    
    return new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = reject;
    });
}

export async function getDataPoints() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['dataPoints'], 'readonly');
        const store = transaction.objectStore('dataPoints');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = reject;
    });
}

export async function deleteDataPoint(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['dataPoints'], 'readwrite');
        const store = transaction.objectStore('dataPoints');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = reject;
    });
}