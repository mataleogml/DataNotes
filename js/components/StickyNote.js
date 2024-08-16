// components/StickyNote.js

export function createStickyNote(dataPoint) {
    console.log('Creating sticky note for data point:', dataPoint);
    const stickyNote = document.createElement('div');
    stickyNote.id = dataPoint.id;
    stickyNote.className = 'sticky-note bg-yellow-200 p-2 mb-2 rounded cursor-move relative';
    stickyNote.draggable = true;
    stickyNote.innerHTML = `
        <p class="font-bold">${dataPoint.source}</p>
        <p class="text-sm mb-2">${dataPoint.content}</p>
        <p class="text-xs italic">${dataPoint.insight}</p>
        <small class="text-gray-500">From: ${dataPoint.documentName}</small>
        <div class="absolute top-1 right-1">
            <button class="show-details text-blue-500 font-bold mr-2">ⓘ</button>
            <button class="delete-note text-red-500 font-bold">×</button>
        </div>
    `;
    
    stickyNote.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', dataPoint.id);
    });
    
    console.log('Sticky note created:', stickyNote);
    return stickyNote;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}