const request = require('supertest');
const app = require('../index')

describe('Unit testing the / route', function() {

    it('should return OK status', function() {
      request(app)
		.get('/')
		.expect(200)
		.end(function(err, res) {
			if (err) throw err;
		});
    });

});