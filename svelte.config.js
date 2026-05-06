import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// Netlify-Adapter (laut Modul-Anforderung). Ohne Edge-Functions, weil wir
		// MongoDB-Connections brauchen, die mit Edge Runtime schwierig sind.
		adapter: adapter({
			edge: false,
			split: false
		})
	}
};

export default config;
