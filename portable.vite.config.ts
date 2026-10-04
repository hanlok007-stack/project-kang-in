import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({root:'portable',base:'./',publicDir:'../public',plugins:[react()],build:{outDir:'../portable-dist',emptyOutDir:true,cssCodeSplit:false,rollupOptions:{output:{inlineDynamicImports:true}}}});
