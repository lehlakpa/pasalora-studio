import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,fileURLToPath(new URL('../backend',import.meta.url)),'PORT');
 return {plugins:[react()],server:{proxy:{'/api':{target:`http://127.0.0.1:${Number(env.PORT)||4000}`,changeOrigin:true}}}};
});
