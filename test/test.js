const request = require('supertest');
const app = require('../index')

describe('Unit testing the / route', function() {

    it('Should return OK status', function() {
      request(app)
		.get('/')
		.expect(400)
		.end(function(err, res) {
			if (err) throw err;
		});
    });

});