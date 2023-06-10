import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
var path = require('path')

// https://vitejs.dev/config/
export default defineConfig(
{
    plugins: [vue(), vueJsx()],
    resolve: 
    { 
        alias: 
        { 
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            "@shared": fileURLToPath(new URL('../types/', import.meta.url)),
        },
    },
        
    server:
	{
		proxy:
		{
			'/socket.io': {
				target: 'http://192.168.8.130:55561',
				changeOrigin: true,
				ws: true,
				secure: false
			},
            '/api': {
				target: 'http://192.168.8.130:55561',
				changeOrigin: true,
			},
            '/siofu': {
				target: 'http://192.168.8.130:55561',
				changeOrigin: true,
			},
		}
	},
})
