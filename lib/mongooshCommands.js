import colors from 'chalk';
import mongooseConnect from './mongooseConnect.js';

export default {
	use(db) {
		if (!db) return console.log('Must specify the database name to switch to');
		this.settings.mongoose.database = db;
		return mongooseConnect.call(this)
			.then(()=> console.log('Switched to', colors.cyan(db), 'database'));
	},
};
