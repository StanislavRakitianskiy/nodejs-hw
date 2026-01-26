import 'dotenv/config';
import { connectMongoDB } from '../db/connectMongoDB.js';
import { Note } from '../models/note.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const importNotes = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Read notes.json file
    const notesPath = join(__dirname, '../../notes.json');
    const notesData = JSON.parse(fs.readFileSync(notesPath, 'utf8'));

    // Check if notes already exist
    const existingNotes = await Note.countDocuments();
    if (existingNotes > 0) {
      console.log(`⚠️  Database already contains ${existingNotes} notes.`);
      console.log('Do you want to delete existing notes and import new ones?');
      console.log('To re-import, delete existing notes first or use: Note.deleteMany({})');
      return;
    }

    // Insert notes
    const result = await Note.insertMany(notesData);
    console.log(`✅ Successfully imported ${result.length} notes to MongoDB!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing notes:', error.message);
    process.exit(1);
  }
};

importNotes();
