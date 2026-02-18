/**
 * Bulk Prompt Upload Service
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export function parseCSV(content) {
  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return { prompts: [], errors: ['CSV file is empty'] };

  const prompts = [], errors = [];
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('prompt');
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const lineNum = i + 1;
    try {
      const parts = lines[i].split(',');
      const prompt = parts[0]?.replace(/^"|"$/g, '').trim() || '';
      if (!prompt || prompt.length < 5 || prompt.length > 500) continue;
      prompts.push({ text: prompt, lineNumber: lineNum });
    } catch (err) { errors.push(`Line ${lineNum}: Error`); }
  }
  return { prompts, errors };
}

export async function processBulkUpload(clientId, userId, csvContent) {
  logger.info(`Processing bulk upload for client ${clientId}`);
  const { prompts: parsed, errors } = parseCSV(csvContent);
  if (parsed.length === 0) return { success: false, added: 0, errors };

  const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
  if (!client) throw new Error('Client not found');

  const existing = client.searchPrompts || [];
  const existingSet = new Set(existing.map(p => p.toLowerCase()));
  const newPrompts = [], duplicates = [];

  for (const p of parsed) {
    if (existingSet.has(p.text.toLowerCase())) { duplicates.push(p.text); continue; }
    newPrompts.push(p.text);
    existingSet.add(p.text.toLowerCase());
  }

  if (newPrompts.length > 0) {
    await prisma.client.update({ where: { id: clientId }, data: { searchPrompts: [...existing, ...newPrompts] } });
  }
  return { success: true, added: newPrompts.length, duplicates: duplicates.length, total: parsed.length, errors };
}

export function generateCSVTemplate() {
  return `prompt,category
"Best digital marketing agencies?",discovery
"Top SEO companies",comparison`;
}

export function validateCSV(content) {
  const { prompts, errors } = parseCSV(content);
  return { valid: prompts.length > 0, promptCount: prompts.length, errors, preview: prompts.slice(0, 5).map(p => p.text) };
}

export default { parseCSV, processBulkUpload, generateCSVTemplate, validateCSV };
