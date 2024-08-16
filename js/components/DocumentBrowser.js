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
        await viewDocument(docId);
    } else if (event.target.classList.contains('delete-doc')) {
        const docId = event.target.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this document and its associated data points?')) {
            await deleteRawDocument(docId);
            document.dispatchEvent(new CustomEvent('dataUpdated'));
            document.dispatchEvent(new CustomEvent('documentsUpdated'));
        }
    }
}

async function viewDocument(docId) {
    const documents = await getRawDocuments();
    const docData = documents.find(doc => doc.id === docId);

    if (!docData) {
        console.error('Document not found');
        return;
    }

    const modal = createViewModal(docData);
    document.body.appendChild(modal);
}

function createViewModal(docData) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
    modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-3/4 shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">${docData.name}</h3>
                <button class="close-modal text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div class="overflow-y-auto max-h-96 bg-gray-100 p-4 rounded">
                <pre class="whitespace-pre-wrap">${docData.content}</pre>
            </div>
            <div class="mt-4">
                <p class="text-sm text-gray-500">Uploaded: ${new Date(docData.timestamp).toLocaleString()}</p>
            </div>
        </div>
    `;

    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());

    return modal;
}