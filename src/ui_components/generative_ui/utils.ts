import type { UIComponent } from './types';

/**
 * Robustly extracts all JSON objects and arrays from a string using bracket matching.
 */
export const extractAllJson = (text: string): UIComponent[] => {
    const results: any[] = [];
    let i = 0;
    
    while (i < text.length) {
        const nextBrace = text.indexOf('{', i);
        const nextBracket = text.indexOf('[', i);
        
        if (nextBrace === -1 && nextBracket === -1) break;
        
        let startChar = '{', endChar = '}', startIdx = nextBrace;
        if (nextBracket !== -1 && (nextBrace === -1 || nextBracket < nextBrace)) {
            startChar = '['; endChar = ']'; startIdx = nextBracket;
        }

        let depth = 0;
        let endIdx = -1;
        for (let j = startIdx; j < text.length; j++) {
            if (text[j] === startChar) depth++;
            else if (text[j] === endChar) {
                depth--;
                if (depth === 0) {
                    endIdx = j;
                    break;
                }
            }
        }

        if (endIdx !== -1) {
            const potentialJson = text.substring(startIdx, endIdx + 1);
            try {
                const parsed = JSON.parse(potentialJson);
                if (Array.isArray(parsed)) results.push(...parsed);
                else results.push(parsed);
                i = endIdx + 1;
            } catch (e) {
                i = startIdx + 1;
            }
        } else {
            i = startIdx + 1;
        }
    }
    
    // Filter and validate results
    return results.filter(s => {
        // Must be an object with a type property
        if (!s || typeof s !== 'object' || !s.type) return false;
        
        // Type must be a string
        if (typeof s.type !== 'string') {
            console.warn(`[extractAllJson] Filtered out component with non-string type:`, s.type);
            return false;
        }
        
        // Type should not contain special characters (function code, etc.)
        // Valid component types are lowercase with hyphens only
        if (!/^[a-z0-9-]+$/.test(s.type)) {
            console.warn(`[extractAllJson] Filtered out component with invalid type format: "${s.type}"`);
            return false;
        }
        
        return true;
    });
};

/**
 * Generates a stable ID for a component based on its type and index.
 */
export const generateComponentId = (type: string, index: number): string => {
    return `${type}-${Date.now()}-${index}`;
};
