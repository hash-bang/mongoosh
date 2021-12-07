import {expect} from 'chai';
import diff from '../lib/diff.js';

describe('diff()', ()=> {

	it('should perform simple diffs', ()=> {
		expect(diff(
			{a: 1, b: 2, c: 3},
			{a: 1, b: 9, c: 3},
		)).to.deep.equal({
			changes: {b: 9},
			dropped: [],
		});

		expect(diff(
			{a: 1, b: 2, c: 3},
			{a: 1, b: 2, c: 3, d: 4},
		)).to.deep.equal({
			changes: {d: 4},
			dropped: [],
		});

		expect(diff(
			{a: 1, b: 2, c: 3},
			{},
		)).to.deep.equal({
			changes: {},
			dropped: ['a', 'b', 'c'],
		});

		expect(diff(
			{a: [1, 2, 3]},
			{a: [1, 2, 3]},
		)).to.deep.equal({
			changes: {},
			dropped: [],
		});

		expect(diff(
			{a: [1, 2, 3]},
			{a: [1, 2, 4]},
		)).to.deep.equal({
			changes: {a: [1, 2, 4]},
			dropped: [],
		});
	});

});
