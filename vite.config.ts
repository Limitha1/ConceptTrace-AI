import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { doubtApiPlugin } from './server/doubtApi.ts'
import { syllabusApiPlugin } from './server/syllabusApi.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      doubtApiPlugin(env),
      syllabusApiPlugin(env)
    ],
  };
});
