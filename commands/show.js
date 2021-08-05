export let description = 'Show an entity such as collections';

/**
* Show an entity
* @param {string} what The entity to show. ENUM: 'collections'
* @returns {Promise} A promise which resolves when the operation has completed
*/
export default function(what) {
	switch(what.toLowerCase()) {
		case 'collections':
			Object.keys(this.settings.context.db)
				.sort()
				.forEach(collection => console.log(collection))
			break;
		default:
			console.warn('Unknown item to show, select one of: collections');
	}
};
