import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './sanity/schemas';

export default defineConfig({
  name: 'default',
  title: 'Billing App Sanity Studio',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1td87nc9',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  basePath: '/sanity-studio',

  plugins: [structureTool()],

  schema: {
    types: schemaTypes,
  },
});
