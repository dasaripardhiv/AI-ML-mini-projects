import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const generateId = () => {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

export const readCollection = (collection) => {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (error) {
    console.error(`Error reading collection ${collection}:`, error);
    return [];
  }
};

export const writeCollection = (collection, data) => {
  const filePath = getFilePath(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing collection ${collection}:`, error);
    return false;
  }
};

export const dbFallback = {
  find: (collection, query = {}) => {
    const data = readCollection(collection);
    return data.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findOne: (collection, query = {}) => {
    const data = readCollection(collection);
    return data.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  },

  findById: (collection, id) => {
    const data = readCollection(collection);
    return data.find(item => item._id === id) || null;
  },

  insertOne: (collection, doc) => {
    const data = readCollection(collection);
    const newDoc = { _id: generateId(), ...doc, createdAt: new Date().toISOString() };
    data.push(newDoc);
    writeCollection(collection, data);
    return newDoc;
  },

  updateOne: (collection, query, updateDoc) => {
    const data = readCollection(collection);
    const index = data.findIndex(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index === -1) return null;

    const item = data[index];
    let updated = { ...item };

    // Support standard $set, $inc, $push operators
    if (updateDoc.$set) {
      updated = { ...updated, ...updateDoc.$set };
    }
    if (updateDoc.$inc) {
      for (const key in updateDoc.$inc) {
        updated[key] = (updated[key] || 0) + updateDoc.$inc[key];
      }
    }
    if (updateDoc.$push) {
      for (const key in updateDoc.$push) {
        if (!Array.isArray(updated[key])) updated[key] = [];
        updated[key].push(updateDoc.$push[key]);
      }
    }

    // Direct object update if no operators are present
    if (!updateDoc.$set && !updateDoc.$inc && !updateDoc.$push) {
      updated = { ...updated, ...updateDoc };
    }

    data[index] = updated;
    writeCollection(collection, data);
    return updated;
  },

  updateMany: (collection, query, updateDoc) => {
    const data = readCollection(collection);
    let updatedCount = 0;

    const updatedData = data.map(item => {
      let matches = true;
      for (const key in query) {
        if (item[key] !== query[key]) {
          matches = false;
          break;
        }
      }

      if (!matches) return item;

      let updated = { ...item };
      updatedCount++;

      if (updateDoc.$set) {
        updated = { ...updated, ...updateDoc.$set };
      }
      if (updateDoc.$inc) {
        for (const key in updateDoc.$inc) {
          updated[key] = (updated[key] || 0) + updateDoc.$inc[key];
        }
      }
      if (updateDoc.$push) {
        for (const key in updateDoc.$push) {
          if (!Array.isArray(updated[key])) updated[key] = [];
          updated[key].push(updateDoc.$push[key]);
        }
      }

      if (!updateDoc.$set && !updateDoc.$inc && !updateDoc.$push) {
        updated = { ...updated, ...updateDoc };
      }

      return updated;
    });

    writeCollection(collection, updatedData);
    return { matchedCount: updatedCount, modifiedCount: updatedCount };
  },

  deleteOne: (collection, query) => {
    const data = readCollection(collection);
    const index = data.findIndex(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index === -1) return { deletedCount: 0 };

    data.splice(index, 1);
    writeCollection(collection, data);
    return { deletedCount: 1 };
  }
};
