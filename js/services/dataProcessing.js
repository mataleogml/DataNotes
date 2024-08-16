// services/dataProcessing.js
import { processAndGenerateStickies } from './gptService.js';

export async function processRawData(rawData, documentId, documentName) {
    console.log(`Processing raw data for document: ${documentName}`);
    
    try {
        const stickyNotes = await processAndGenerateStickies(rawData, documentName);
        
        // Add documentId to each sticky note
        stickyNotes.forEach(note => {
            note.documentId = documentId;
            console.log('Processed sticky note:', note);
        });

        console.log(`Generated ${stickyNotes.length} sticky notes`);
        return stickyNotes;
    } catch (error) {
        console.error('Error processing raw data:', error);
        throw error;
    }
}