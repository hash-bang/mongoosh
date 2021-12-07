import {expect} from 'chai';
import parseOptions from '../lib/parseOptions.js';

describe('options()', ()=> {

	it('should parse various options', ()=>  {
		expect(parseOptions(
			'foo -a -b=two bar --c-long-value --no-donuts-today baz'.split(/\s+/),
		)).to.deep.equal({
			args: ['foo', 'bar', 'baz'],
			options: {
				a: true,
				b: 'two',
				cLongValue: true,
				donutsToday: false,
			},
		})
	});

	it.only('should support aliases and defaults', ()=>  {
		expect(parseOptions(
			'foo --dog bar'.split(/\s+/),
			{
				alias: {
					cat: 'dog',
				},
			},
		)).to.deep.equal({
			args: ['foo', 'bar'],
			options: {
				cat: true,
			},
		})

		expect(parseOptions(
			'foo bar'.split(/\s+/),
			{
				chickens: 2,
			},
		)).to.deep.equal({
			args: ['foo', 'bar'],
			options: {
				chickens: 2,
			},
		})

		expect(parseOptions(
			'foo --no-geese bar'.split(/\s+/),
			{
				birds: true,
				alias: {
					birds: ['avians', 'geese'],
				},
			},
		)).to.deep.equal({
			args: ['foo', 'bar'],
			options: {
				birds: false,
			},
		})
	});

});
