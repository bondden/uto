/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 16.05.2015.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _libUtil = require('../lib/util');

var UtilLib = _interopRequireWildcard(_libUtil);

var express = require('express'),
    path = require('path'),
    L = UtilLib.Util.log;

var singleton = Symbol();
var singletonEnforcer = Symbol();

var Server = (function () {
	function Server(enforcer) {
		_classCallCheck(this, Server);

		if (enforcer != singletonEnforcer) {
			throw 'Cannot construct Server singleton';
		} else {
			L('Server initialized');
		}
	}

	_createClass(Server, [{
		key: 'run',
		value: function run(cnf) {

			L('//at Server.run');

			this.cnf = cnf;
			this.x = express();

			this.x.use(express['static'](path.join(__dirname, cnf.p.web.assets)));
			this.x.use('/d/web/', function (err, req, res, next) {
				res.status(err.status || 200);
				res.send('<b>test</b>');
			});

			this.x.get('/', function (req, res) {
				res.send('Hello World');
			});

			this.x.listen(80);
		}
	}], [{
		key: 'instance',
		get: function get() {
			if (!this[singleton]) {
				this[singleton] = new Server(singletonEnforcer);
			}
			return this[singleton];
		}
	}]);

	return Server;
})();

exports.Server = Server;
//# sourceMappingURL=maps/server.es7.js.map