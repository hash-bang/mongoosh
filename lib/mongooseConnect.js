import mongoose from 'mongoose';

export default function() {
	return mongoose.disconnect() // Disconnect existing if we have any
		.then(()=> mongoose.connect(
			this.settings.mongoose.uri
				? this.settings.mongoose.uri
				: `mongodb://${this.settings.mongoose.host}/${this.settings.mongoose.database || 'test'}`
		, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		}))
		.then(()=> {
			this.settings.context.db = {};
			mongoose.connection.db.listCollections().toArray()
				.then(collections => collections.forEach(collection =>
					this.settings.context.db[collection.name] = mongoose.model(collection.name, {}) // Init with blank schema
				))
		})
};
