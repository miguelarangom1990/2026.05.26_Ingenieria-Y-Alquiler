import { levenshteinDistance, normalizeText } from './textUtils';

export const isSimilarCompany = (searchQuery: string, targetCompany: string) => {
    const search = normalizeText(searchQuery);
    const target = normalizeText(targetCompany);
    if (!search || !target) return false;
    if (target.includes(search) || search.includes(target)) return true;
    
    if (Math.abs(search.length - target.length) > 3) return false;
    let differences = 0;
    const minLength = Math.min(search.length, target.length);
    for (let i = 0; i < minLength; i++) {
        if (search[i] !== target[i]) differences++;
    }
    return differences <= 2;
};

export const isSimilarSite = (searchQuery: string, targetSite: string) => {
    const search = normalizeText(searchQuery);
    const target = normalizeText(targetSite);
    
    if (!search || !target) return false;
    
    // Si contiene la frase exacta
    if (target.includes(search) || search.includes(target)) return true;

    const searchWords = search.split(" ");
    const targetWords = target.split(" ");
    
    let matchedWords = 0;
    for (const searchWord of searchWords) {
        const word = searchWord.replace(/[.,-]/g, "");
        if (!word) continue;
        
        let hasMatch = false;
        for (const targetWord of targetWords) {
            // Abreviaturas inicio de palabra
            if (word.length <= 3 && targetWord.startsWith(word)) {
                hasMatch = true;
                break;
            }
            
            // Levenshtein con tolerancia controlada por longitud de la palabra
            const distance = levenshteinDistance(word, targetWord);
            const maxDistance = targetWord.length >= 6 ? 2 : (targetWord.length > 3 ? 1 : 0);
            
            if (distance <= maxDistance || targetWord.includes(word) || word.includes(targetWord)) {
                hasMatch = true;
                break;
            }
        }
        if (hasMatch) matchedWords++;
    }
    
    const relevantSearchWords = searchWords.filter(w => w.replace(/[.,-]/g, "").length > 0);
    const threshold = relevantSearchWords.length <= 2 ? relevantSearchWords.length : Math.ceil(relevantSearchWords.length * 0.6);
    
    const globalDistance = levenshteinDistance(search, target);
    const maxGlobalTypos = target.length <= 3 ? 0 : (target.length < 8 ? 1 : Math.floor(target.length * 0.25));
    const isGlobalSimilar = globalDistance <= maxGlobalTypos;

    return (matchedWords >= threshold && relevantSearchWords.length > 0) || isGlobalSimilar;
};

export const isSimilarCategory = (searchQuery: string, targetEntity: string) => {
    const search = normalizeText(searchQuery);
    const target = normalizeText(targetEntity);
    if (!search || !target) return false;
    
    if (search === target) return true;
    if (target.includes(search)) return true;
    
    if (Math.abs(search.length - target.length) <= 2) {
        if (levenshteinDistance(search, target) <= 2) return true;
    }
    return false;
};

export const isSimilarItemType = isSimilarCategory;
export const isSimilarEquipment = isSimilarCategory;
