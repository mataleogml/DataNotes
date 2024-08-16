// components/DocumentBrowser.js
import { getRawDocuments, deleteRawDocument } from '../services/dataStorage.js';

export function initDocumentBrowser() {
    const browserContainer = document.createElement('div');
    browserContainer.id = 'document-browser';
    browserContainer.className = 'mt-4';
    
    document.querySelector('.container').insertBefore(browserContainer, document.getElementById('dashboard'));
    
    updateDocumentList();
    
    document.addEventListener('documentsUpdated', updateDocumentList);
}

async function updateDocumentList() {
    const browserContainer = document.getElementById('document-browser');
    const documents = await getRawDocuments();
    
    browserContainer.innerHTML = `
        <h2 class="text-2xl font-bold mb-2">Raw Documents</h2>
        <ul class="space-y-2">
            ${documents.map(doc => `
                <li class="flex justify-between items-center bg-white p-2 rounded shadow">
                    <span>${doc.name}</span>
                    <div>
                        <button class="view-doc bg-blue-500 text-white px-2 py-1 rounded mr-2" data-id="${doc.id}">View</button>
                        <button class="delete-doc bg-red-500 text-white px-2 py-1 rounded" data-id="${doc.id}">Delete</button>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;
    
    browserContainer.addEventListener('click', handleDocumentAction);
}

async function handleDocumentAction(event) {
    if (event.target.classList.contains('view-doc')) {
        const docId = event.target.getAttribute('data-id');
        // Implement view functionality
        console.log('View document', docId);
    } else if (event.target.classList.contains('delete-doc')) {
        const docId = event.target.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this document and its associated data points?')) {
            await deleteRawDocument(docId);
            document.dispatchEvent(new CustomEvent('dataUpdated'));
            document.dispatchEvent(new CustomEvent('documentsUpdated'));
        }
    }
}