const { createClient } = require('@sanity/client');
const fs = require('fs');

// Read .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1td87nc9',
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_API_TOKEN,
});

async function main() {
  const count = await client.fetch('count(*[_type == "particular"])');
  console.log('Particulars count in Sanity:', count);

  const sample = await client.fetch('*[_type == "particular"][0..2]');
  console.log('Sample particulars:', JSON.stringify(sample, null, 2));

  const papers = await client.fetch('*[_type == "paper"]{_id, paperId, name, paperGroup, paperGroupId}');
  console.log(`Found ${papers.length} papers`);
  if (papers.length > 0) console.log('Sample paper:', papers[0]);

  const paperGroups = await client.fetch('*[_type == "paperGroup"]{_id, groupId, name}');
  console.log(`Found ${paperGroups.length} paper groups`);
  if (paperGroups.length > 0) console.log('Sample paper group:', paperGroups[0]);

  const machineCats = await client.fetch('*[_type == "machineCategory"]{_id, categoryId, name}');
  console.log(`Found ${machineCats.length} machine categories`);
  if (machineCats.length > 0) console.log('Sample machine category:', machineCats[0]);

  const categories = await client.fetch('*[_type == "category"]{_id, categoryId, name}');
  console.log(`Found ${categories.length} categories`);
  if (categories.length > 0) console.log('Sample category:', categories[0]);
}

main().catch(console.error);

