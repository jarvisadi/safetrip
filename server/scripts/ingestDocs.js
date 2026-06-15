import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import pool from '../config/db.js';
import { getEmbedding } from '../services/embeddings.service.js';

dotenv.config();

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

const readTextFile = (filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
};

const readPDFFile = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

const splitTextIntoChunks = (text) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = text.slice(i, i + CHUNK_SIZE);
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }
  return chunks;
};

const ingestFile = async (filePath, fileName) => {
  try {
    let text = '';
    
    if (fileName.endsWith('.pdf')) {
      text = await readPDFFile(filePath);
    } else {
      text = readTextFile(filePath);
    }

    const chunks = splitTextIntoChunks(text);
    console.log(`Processing ${fileName}: ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Ingesting chunk ${i + 1} of ${chunks.length} from ${fileName}`);
      
      const embedding = await getEmbedding(chunk);
      
      await pool.query(
        'INSERT INTO documents (title, content, embedding) VALUES ($1, $2, $3)',
        [fileName, chunk, embedding]
      );
    }

    console.log(`Successfully ingested ${fileName}`);
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
  }
};

const main = async () => {
  try {
    const knowledgeBasePath = path.join(process.cwd(), 'knowledge-base');
    
    if (!fs.existsSync(knowledgeBasePath)) {
      console.error('Knowledge base folder not found:', knowledgeBasePath);
      process.exit(1);
    }

    const files = fs.readdirSync(knowledgeBasePath);
    const textFiles = files.filter(file => file.endsWith('.txt') || file.endsWith('.pdf'));

    if (textFiles.length === 0) {
      console.log('No .txt or .pdf files found in knowledge-base folder');
      process.exit(0);
    }

    console.log(`Found ${textFiles.length} files to ingest`);

    for (const file of textFiles) {
      const filePath = path.join(knowledgeBasePath, file);
      await ingestFile(filePath, file);
    }

    console.log('Ingestion complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error during ingestion:', error);
    process.exit(1);
  }
};

main();
