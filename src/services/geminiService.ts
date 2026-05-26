
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGeminiAdvice = async (context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres un experto consultor de logística de construcción. Basado en el siguiente contexto de una app de gestión de maquinaria, ofrece 3 recomendaciones breves para optimizar la operación: ${context}`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });
    return response.text || "No se pudo generar una recomendación en este momento.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Error al conectar con la inteligencia artificial.";
  }
};

export const analyzeEquipmentNeeds = async (siteDescription: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Sugiere qué tipo de maquinaria sería ideal para el siguiente proyecto de construcción y por qué: ${siteDescription}`,
      config: {
        temperature: 0.5,
      }
    });
    return response.text || "No se pudieron obtener sugerencias.";
  } catch (error) {
    console.error("Error analyzing equipment:", error);
    return "Error al analizar las necesidades del proyecto.";
  }
};

export const getCommercialReport = async (clientCount: number, supplierCount: number, recentActivity: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Actúa como un Director Comercial Senior. Genera un reporte ejecutivo breve (máximo 200 palabras) para una empresa de alquiler de maquinaria pesada que tiene ${clientCount} clientes y ${supplierCount} proveedores activos. Considera esta actividad reciente: ${recentActivity}. Divide el reporte en: 1. Estado Actual, 2. Riesgos Detectados y 3. Oportunidad de Crecimiento. Usa un tono profesional y directo.`,
      config: {
        temperature: 0.6,
      }
    });
    return response.text || "Reporte no disponible.";
  } catch (error) {
    console.error("Error generating commercial report:", error);
    return "Ocurrió un error al generar el reporte comercial inteligente.";
  }
};

export const suggestSynonyms = async (equipmentName: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres un experto en maquinaria de construcción en Colombia (y Latinoamérica). Lista un máximo de 5 sinónimos, nombres comunes, coloquiales o alternativos para el equipo de construcción: "${equipmentName}". Devuelve ÚNICAMENTE los términos separados por comas, sin introducciones ni explicaciones.`,
      config: {
        temperature: 0.3,
      }
    });
    if (response.text) {
      return response.text.split(',').map(s => s.trim().toLowerCase()).filter(s => s && s !== equipmentName.toLowerCase());
    }
    return [];
  } catch (error) {
    console.error("Error suggesting synonyms:", error);
    return [];
  }
};
