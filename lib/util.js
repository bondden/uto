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
var fs = require('fs');

var Util = (function () {
	function Util() {
		_classCallCheck(this, Util);
	}

	_createClass(Util, null, [{
		key: 'styles',
		value: {
			'ne': clc.white,
			'er': clc.red,
			'ok': clc.green,
			'em': clc.yellow,
			'erb': clc.redBright
		},
		enumerable: true
	}, {
		key: 'logFilter',
		value: function value(s) {
			var censorNote = 'FILTERED',
			    censoredKeys = ['pass', 'password', 'userPass', 'userPassword', 'token'];

			for (var i = 0, l = censoredKeys.length; i < l; i++) {
				s = (s + '').replace(new RegExp('"' + censoredKeys[i] + '"s*:s*"([^"]+)"', 'ig'), '"' + censoredKeys[i] + '":"' + censorNote + '"');
			}

			return s;
		},
		enumerable: true
	}, {
		key: 'log',
		value: function value() {
			var msg = arguments.length <= 0 || arguments[0] === undefined ? '\n' : arguments[0];
			var style = arguments.length <= 1 || arguments[1] === undefined ? 'ne' : arguments[1];
			var silent = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

			//todo: transfer settings to log for a) defining a log file, b) setting logging on/off
			//if(!settings.log)return;

			var styles = {
				'ne': clc.white,
				'er': clc.redBright,
				'ok': clc.green,
				'em': clc.yellow,
				'mb': clc.magentaBright,
				'sh': clc.whiteBright
			},
			    apx = false;

			//set console style style
			if (msg instanceof Error) {
				style = 'er';
				apx = '\n' + msg.stack;
			}

			//set log format
			if (typeof msg === 'object') {
				msg = JSON.stringify(msg);
				if (apx) {
					msg += apx;
				}
			}

			msg = Util.logFilter(msg);

			var d = new Date();

			fs.appendFile('./d/utolog.log', d.toUTCString() + '\t' + msg + '\n', function (err) {
				if (err) throw err;
			});

			if (!silent) {
				console.log(styles[style]('\nuto.log: ' + msg));
			}
		},
		enumerable: true
	}]);

	return Util;
})();

exports.Util = Util;
//# sourceMappingURL=maps/util.es7.js.map