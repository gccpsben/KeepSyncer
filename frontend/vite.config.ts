import { fileURLToPath, URL } from 'node:url'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
var path = require('path')

// https://vitejs.dev/config/
export default defineConfig(
{
    plugins: [vue(), vueJsx(), basicSsl()],
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
        https: true,
		proxy:
		{
			'/socket.io': {
				target: 'https://emdt.ddns.net:55562',
				changeOrigin: true,
				ws: true,
				secure: true
			},
            '/api': {
				target: 'https://emdt.ddns.net:55562',
				changeOrigin: true,
			},
            '/siofu': {
				target: 'https://emdt.ddns.net:55562',
				changeOrigin: true,
			},
            // '/socket.io': {
			// 	target: 'http://emdt.ddns.net:55562',
			// 	changeOrigin: true,
			// 	ws: true,
			// 	secure: false
			// },
            // '/api': {
			// 	target: 'http://emdt.ddns.net:55562',
			// 	changeOrigin: true,
			// },
            // '/siofu': {
			// 	target: 'http://emdt.ddns.net:55562',
			// 	changeOrigin: true,
			// },
		}
	},
})
