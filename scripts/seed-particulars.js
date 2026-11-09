const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

// Load environment variables from .env.local if not already in process.env
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[match[1]]) {
          process.env[match[1]] = value.trim();
        }
      }
    });
  }
}

loadEnv();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1td87nc9';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error('Error: SANITY_API_TOKEN is missing from .env.local or environment.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
});

function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/['"“”‘’]/g, '')
    .replace(/[*×x]/g, 'x')
    .replace(/[\/\\]/g, ' ')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function seedParticulars() {
  console.log(`=== Starting Sanity DB Seed for Particulars ===`);
  console.log(`Target Sanity Project: ${projectId} (Dataset: ${dataset})`);

  const jsonPath = path.resolve(__dirname, '..', 'particular.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: File not found at ${jsonPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const particulars = rawData.particulars || [];
  console.log(`Loaded ${particulars.length} particulars from ${path.basename(jsonPath)}`);

  console.log('Fetching reference data (papers, paper groups, machine categories) from Sanity...');
  const [papers, paperGroups, machineCategories] = await Promise.all([
    client.fetch('*[_type == "paper"]{_id, name, paperGroup, paperGroupId}'),
    client.fetch('*[_type == "paperGroup"]{_id, name}'),
    client.fetch('*[_type == "machineCategory"]{_id, name}'),
  ]);

  console.log(`Found in Sanity:
- Papers: ${papers.length}
- Paper Groups: ${paperGroups.length}
- Machine Categories: ${machineCategories.length}`);

  const paperNorm = new Map();
  papers.forEach(p => paperNorm.set(normalize(p.name), p));

  const groupNorm = new Map();
  paperGroups.forEach(g => groupNorm.set(normalize(g.name), g));

  const catNorm = new Map();
  machineCategories.forEach(c => catNorm.set(normalize(c.name), c));

  const groupAliases = {
    [normalize('FS lamination pouch')]: normalize('F5 Lamination Pouch'),
    [normalize('toners and catridges')]: normalize('Toners and Cartridges'),
  };

  const now = new Date().toISOString();
  const docs = particulars.map(item => {
    // 1. Resolve Paper
    let paperObj = item.paperName ? paperNorm.get(normalize(item.paperName)) : null;

    // 2. Resolve Paper Group
    let groupKey = normalize(item.paperGroup);
    if (groupAliases[groupKey]) groupKey = groupAliases[groupKey];
    let groupObj = groupKey ? groupNorm.get(groupKey) : null;

    // Fallback: if paperGroup is null on item, but paper has group association
    if (!groupObj && paperObj && paperObj.paperGroupId) {
      groupObj = { _id: paperObj.paperGroupId, name: paperObj.paperGroup };
    }

    // 3. Resolve Category (Machine Category)
    let catKey = normalize(item.category);
    let catObj = catKey ? catNorm.get(catKey) : null;

    return {
      _id: `particular-${item.id}`,
      _type: 'particular',
      particularId: String(item.id),
      name: item.name ? item.name.trim() : '',
      price: typeof item.price === 'number' ? item.price : (parseFloat(item.price) || 0),
      priceBack: typeof item.price_back === 'number' ? item.price_back : (parseFloat(item.price_back) || 0),
      commisionRate: 0,
      machineCategory: catObj ? catObj.name : (item.category || ''),
      machineCategoryId: catObj ? catObj._id : '',
      paper: paperObj ? paperObj.name : (item.paperName || ''),
      paperId: paperObj ? paperObj._id : '',
      paperGroup: groupObj ? groupObj.name : (item.paperGroup || ''),
      paperGroupId: groupObj ? groupObj._id : '',
      taxNumber: '',
      isActive: true,
      createdAt: now,
    };
  });

  // Batch insert/update using Sanity transaction in batches of 50
  const BATCH_SIZE = 50;
  console.log(`Seeding ${docs.length} documents into Sanity DB in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    const transaction = client.transaction();
    batch.forEach(doc => {
      transaction.createOrReplace(doc);
    });
    await transaction.commit();
    console.log(`✓ Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1} - ${Math.min(i + BATCH_SIZE, docs.length)} of ${docs.length})`);
  }

  // Verification
  console.log('\nVerifying seeded documents in Sanity DB...');
  const totalCount = await client.fetch('count(*[_type == "particular"])');
  console.log(`Total particulars in Sanity DB now: ${totalCount}`);

  console.log('\n=== Seeding completed successfully! ===');
}

seedParticulars().catch(err => {
  console.error('Seed failed with error:', err);
  process.exit(1);
});

