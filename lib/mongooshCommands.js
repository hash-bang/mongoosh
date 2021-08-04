import colors from 'chalk';
import mongooseConnect from './mongooseConnect.js';

export default {
	/**
	* Show an entity
	* @param {string} what The entity to show. ENUM: 'collections'
	* @returns {Promise} A promise which resolves when the operation has completed
	*/
	show(what) {
		switch(what.toLowerCase()) {
			case 'collections':
				Object.keys(this.settings.context.db)
					.sort()
					.forEach(collection => console.log(collection))
				break;
			default:
				console.warn('Unknown item to show, select one of: collections');
		}
	},

	/**
	* Switch to another database on this host
	* @param {string} db The database to switch to
	* @returns {Promise} A promise which resolves when the operation has completed
	*/
	use(db) {
		if (!db) return console.warn('Must specify the database name to switch to');
		this.settings.mongoose.database = db;
		return mongooseConnect.call(this)
			.then(()=> console.log('Switched to', colors.cyan(db), 'database'));
	},
};
