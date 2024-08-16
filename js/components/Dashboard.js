// components/Dashboard.js
import { getDataPoints, deleteDataPoint, saveDataPoints } from '../services/dataStorage.js';
import { createStickyNote } from './StickyNote.js';
import { processAndGenerateStickies } from '../services/gptService.js';

export function initDashboard() {
    console.log('Initializing dashboard');
    const dashboard = document.getElementById('dashboard');
    const notSorted = document.getElementById('not-sorted');
    const groupsContainer = document.getElementById('groups-container');

    if (!dashboard || !notSorted || !groupsContainer) {
        console.error('One or more dashboard elements not found in DOM');
        return;
    }

    document.addEventListener('dataUpdated', updateDashboard);
    
    dashboard.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    groupsContainer.addEventListener('drop', handleDrop);
    groupsContainer.addEventListener('click', handleGroupAction);

    updateDashboard();
}

export async function processDocument(rawData, documentId, documentName) {
    const progressCallback = (newStickies) => {
        newStickies.forEach(stickyData => {
            stickyData.documentId = documentId;
            const stickyNote = createStickyNote(stickyData);
            document.getElementById('not-sorted').appendChild(stickyNote);
            saveDataPoints([stickyData]); // Save each new sticky note to storage
        });
    };

    await processAndGenerateStickies(rawData, documentName, progressCallback);
    // After processing is complete, trigger a final update
    document.dispatchEvent(new CustomEvent('dataUpdated'));
}

async function updateDashboard() {
    console.log('Updating dashboard');
    const dataPoints = await getDataPoints();
    const notSorted = document.getElementById('not-sorted');
    
    if (!notSorted) {
        console.error('Not Sorted container not found in DOM');
        return;
    }
    
    notSorted.innerHTML = '<h2 class="text-xl font-semibold mb-2">Not Sorted</h2>';
    
    dataPoints.forEach(dataPoint => {
        console.log('Creating sticky note for data point:', dataPoint);
        const stickyNote = createStickyNote(dataPoint);
        notSorted.appendChild(stickyNote);
    });
    
    notSorted.addEventListener('click', handleStickyNoteAction);
    console.log('Dashboard update completed');
}

async function handleDrop(e) {
    e.preventDefault();
    const stickyNoteId = e.dataTransfer.getData('text/plain');
    const stickyNote = document.getElementById(stickyNoteId);
    
    if (stickyNote) {
        const group = e.target.closest('.group') || createNewGroup();
        group.querySelector('.group-content').appendChild(stickyNote);
        // Ensure event listeners are set for the moved sticky note
        stickyNote.querySelector('.show-details').addEventListener('click', () => handleStickyNoteAction({ target: stickyNote.querySelector('.show-details') }));
        stickyNote.querySelector('.delete-note').addEventListener('click', () => handleStickyNoteAction({ target: stickyNote.querySelector('.delete-note') }));
    }
}

function createNewGroup() {
    const group = document.createElement('div');
    group.className = 'group bg-gray-200 p-2 mb-2 rounded';
    group.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <h3 class="group-title text-lg font-semibold">New Group</h3>
            <div>
                <button class="rename-group bg-blue-500 text-white px-2 py-1 rounded mr-2">Rename</button>
                <button class="generate-title bg-green-500 text-white px-2 py-1 rounded mr-2">Generate Title</button>
                <button class="delete-group bg-red-500 text-white px-2 py-1 rounded">Delete Group</button>
            </div>
        </div>
        <div class="group-content"></div>
    `;
    document.getElementById('groups-container').appendChild(group);
    return group;
}

async function handleGroupAction(event) {
    const group = event.target.closest('.group');
    if (!group) return;

    if (event.target.classList.contains('delete-group')) {
        if (confirm('Are you sure you want to delete this group? Sticky notes will be moved back to Not Sorted.')) {
            const notSorted = document.getElementById('not-sorted');
            const stickyNotes = group.querySelectorAll('.sticky-note');
            stickyNotes.forEach(note => notSorted.appendChild(note));
            group.remove();
        }
    } else if (event.target.classList.contains('rename-group')) {
        const newTitle = prompt('Enter new group title:', group.querySelector('.group-title').textContent);
        if (newTitle) {
            group.querySelector('.group-title').textContent = newTitle;
        }
    } else if (event.target.classList.contains('generate-title')) {
        const stickyNotes = group.querySelectorAll('.sticky-note');
        const insights = Array.from(stickyNotes).map(note => {
            const source = note.querySelector('.font-bold').textContent;
            const content = note.querySelector('.text-sm').textContent;
            const insight = note.querySelector('.italic').textContent;
            return `SOURCE: ${source}\nCONTENT: ${content}\nINSIGHT: ${insight}`;
        });
        
        if (insights.length === 0) {
            alert('Add some sticky notes to the group before generating a title.');
            return;
        }

        try {
            const groupContent = insights.join('\n\n');
            const generatedStickies = await processAndGenerateStickies(groupContent, 'Group Content');
            const title = generatedStickies[0]?.insight || 'Generated Group Title';
            group.querySelector('.group-title').textContent = title;
        } catch (error) {
            console.error('Failed to generate group title:', error);
            alert('Failed to generate group title. Please try again or enter a title manually.');
        }
    }
}

async function handleStickyNoteAction(event) {
    const stickyNote = event.target.closest('.sticky-note');
    if (!stickyNote) return;

    if (event.target.classList.contains('delete-note')) {
        if (confirm('Are you sure you want to delete this sticky note?')) {
            await deleteDataPoint(stickyNote.id);
            stickyNote.remove();
            document.dispatchEvent(new CustomEvent('dataUpdated'));
        }
    } else if (event.target.classList.contains('show-details')) {
        const dataPoints = await getDataPoints();
        const dataPoint = dataPoints.find(dp => dp.id === stickyNote.id);
        if (dataPoint) {
            showDetailsModal(dataPoint);
        }
    }
}

function showDetailsModal(dataPoint) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
    modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-3/4 shadow-lg rounded-md bg-white">
            <h3 class="text-lg font-semibold mb-2">Sticky Note Details</h3>
            <p><strong>Source:</strong> ${dataPoint.source}</p>
            <p><strong>Content:</strong> ${dataPoint.content}</p>
            <p><strong>Insight:</strong> ${dataPoint.insight}</p>
            <p><strong>Document:</strong> ${dataPoint.documentName}</p>
            <p><strong>Timestamp:</strong> ${new Date(dataPoint.timestamp).toLocaleString()}</p>
            <button class="mt-3 bg-blue-500 text-white px-4 py-2 rounded" onclick="this.closest('.fixed').remove()">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

export { updateDashboard, handleDrop, handleGroupAction, handleStickyNoteAction };