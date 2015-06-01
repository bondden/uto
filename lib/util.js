/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 25.05.2015.
 */

'use strict';
Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var clc = require('cli-color');

var Util = (function () {
	function Util() {
		_classCallCheck(this, Util);
	}

	_createClass(Util, null, [{
		key: 'LOG_FILE',
		value: './d/log.log',
		enumerable: true
	}, {
		key: 'styles',
		value: {
			'ne': clc.white,
			'er': clc.red,
			'ok': clc.green,
			'em': clc.yellow,
			'mb': clc.magentaBright,
			'sh': clc.whiteBright
		},
		enumerable: true
	}, {
		key: 'log',
		value: function log() {
			var msg = arguments[0] === undefined ? '\n' : arguments[0];
			var type = arguments[1] === undefined ? 'ne' : arguments[1];
			var e = arguments[2] === undefined ? false : arguments[2];

			console.log(Util.styles[type](msg));

			if (type === 'er' && e) {
				//console.log('\n');
				console.trace(clc.redBright(e));
				console.log('\n');
			}
		}
	}]);

	return Util;
})();

exports.Util = Util;
//# sourceMappingURL=maps/util.es7.js.map