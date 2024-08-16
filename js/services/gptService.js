// services/gptService.js
import { CONFIG } from '../config.js';

const MAX_CHUNK_SIZE = 4000; // Characters, not tokens. Adjust based on your needs.
const OVERLAP_SIZE = 1000; // Characters of overlap between chunks

async function callGPT4API(messages) {
    console.log('Calling GPT-4 API with messages:', messages);
    const response = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: CONFIG.MODEL,
            messages: messages,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        console.error('GPT API request failed:', response.status, response.statusText);
        throw new Error(`GPT API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('GPT-4 API response received');
    return data.choices[0].message.content.trim();
}

export async function processAndGenerateStickies(rawData, documentName, progressCallback) {
    console.log(`Processing document: ${documentName}, length: ${rawData.length} characters`);
    
    let allStickies = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < rawData.length) {
        chunkIndex++;
        console.log(`Processing chunk ${chunkIndex}, starting at index ${startIndex}`);
        
        let endIndex = Math.min(startIndex + MAX_CHUNK_SIZE, rawData.length);
        
        // Try to find a natural break point (end of sentence)
        const naturalBreak = rawData.lastIndexOf('.', endIndex);
        if (naturalBreak > startIndex && naturalBreak < endIndex) {
            endIndex = naturalBreak + 1;
        }

        const chunk = rawData.slice(startIndex, endIndex);
        
        const messages = [
            {
                role: "system",
                content: `You are an AI assistant tasked with analyzing an interview transcript about a disaster situation and creating sticky notes. Each sticky note should capture a key point, insight, or quote from the conversation. Focus on important information, decisions, or emotions expressed by the Resident. This is chunk ${chunkIndex}.`
            },
            {
                role: "user",
                content: chunk
            },
            {
                role: "user",
                content: "Based on this part of the interview transcript, generate a series of sticky notes. Each sticky note should be in the following format:\n\nSticky Note X:\nSOURCE: [Resident or Interviewer]\nCONTENT: [Brief quote or paraphrase]\nINSIGHT: [Key takeaway or interpretation]\n\nProvide at least 3 sticky notes, focusing on the most significant points made by the Resident. If this chunk doesn't contain enough meaningful content for 3 sticky notes, generate as many as you can."
            }
        ];

        try {
            const response = await callGPT4API(messages);
            console.log('Raw GPT-4 response for chunk:', response);

            const chunkStickies = parseStickiesFromResponse(response, documentName);
            console.log(`Parsed ${chunkStickies.length} sticky notes from chunk ${chunkIndex}`);
            allStickies = allStickies.concat(chunkStickies);
            
            // Call the progress callback with the new stickies
            if (progressCallback) {
                progressCallback(chunkStickies);
            }
        } catch (error) {
            console.error(`Error processing chunk ${chunkIndex}:`, error);
        }

        startIndex = endIndex;
        if (startIndex >= rawData.length) {
            break; // Ensure we exit the loop when we've processed the entire document
        }
        startIndex = Math.max(startIndex - OVERLAP_SIZE, endIndex);
    }

    console.log(`Total sticky notes generated: ${allStickies.length}`);
    return allStickies;
}

function parseStickiesFromResponse(response, documentName) {
    const stickyNotes = [];
    const stickyRegex = /Sticky Note \d+:\s*SOURCE: ([^\n]+)\s*CONTENT: ([^\n]+)\s*INSIGHT: ([^\n]+)/g;
    let match;

    while ((match = stickyRegex.exec(response)) !== null) {
        stickyNotes.push({
            id: `data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: match[1].trim(),
            content: match[2].trim(),
            insight: match[3].trim(),
            documentName: documentName,
            timestamp: new Date().toISOString()
        });
    }

    if (stickyNotes.length === 0) {
        console.warn("No sticky notes found in response");
    }

    return stickyNotes;
}
