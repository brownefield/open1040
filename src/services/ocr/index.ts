export { ocrW2Image, isSupportedImageType, isPDF, formatFileSize } from './tesseractService';
export { aiExtractW2, getExtractionPrompt } from './aiVisionService';
export { parseW2Text, parseW2FromAIResponse } from './w2Parser';
export type { W2ParseResult } from './w2Parser';
export type { OCRProgress } from './tesseractService';
