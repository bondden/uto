/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 16.05.2015.
 */

/**
 * Connects to OrientDb server.
 * Creates DB schema or adds classes to existent schema from parsedData.
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

var fs = require('fs'),
    L = UtilLib.Util.log,
    clc = require('cli-color'),
    ___ = console.log,
    t = false,
    E = function E() {
	var n = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
	var msg = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
	var e = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];
	var rj = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];
	var thr = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

	if (!msg) {
		msg = ': ' + msg + '\n';
	} else {
		msg = '\n';
	}
	L('Error Importer#' + n + msg);
	L(e, 'er');

	if (t) clearInterval(t);

	if (e) {
		L(e, 'er');
		if (rj) {
			rj(e);
		}
		if (thr) {
			throw e;
		}
	}
};

var Importer = (function () {
	function Importer(db, cnf) {
		_classCallCheck(this, Importer);

		this.db = db;
		this.cnf = cnf;
	}

	_createClass(Importer, [{
		key: 'composeClass',
		value: function composeClass(classData) {

			if (!classData.hasOwnProperty('name') || !classData.name) {
				throw new Error('Error Importer#6: Incorrect class ' + classData);
			}

			var cd = {
				'name': classData.name,
				'parent': false,
				'queryString': ''
			};

			var c = {
				'name': classData.name,
				'extends': '',
				'abstract': ''
			};

			if (classData.hasOwnProperty('superClass') && classData.superClass) {
				c['extends'] = ' extends ' + classData.superClass;
				cd.parent = classData.superClass;
			}

			if (classData.hasOwnProperty('abstract') && classData.abstract) {
				c.abstract = ' ABSTRACT';
			}

			cd.queryString += 'create class ' + c.name + c['extends'] + c.abstract + '\n';

			classData.properties.forEach(function (p) {
				cd.queryString += 'create property ' + c.name + '.' + p.name + ' ' + p.type + '\n';
			});

			return cd;
		}
	}, {
		key: 'composeQuery',
		value: function composeQuery(data) {

			var q = '';
			if (data.classes.length === 0) {
				return q;
			}

			var holder = this;

			var classes = [];
			data.classes.forEach(function (c) {
				classes.push(holder.composeClass(c));
			});

			//sort classes to set superClass to the top
			for (var i = 0, l = classes.length; i < l; i++) {
				if (!classes[i].parent) continue;
				for (var j = 0; j < l; j++) {
					if (classes[j].name === classes[i].parent && j > i) {
						var _t = JSON.parse(JSON.stringify(classes[j]));
						classes[j] = JSON.parse(JSON.stringify(classes[i]));
						classes[i] = _t;
						break;
					}
				}
			}
			//

			for (var i = classes.length - 1; i >= 0; i--) {
				var nm = classes[i].name;
				q += 'truncate class ' + nm + ' UNSAFE\n';
				q += 'drop class ' + nm + '\n';
			}

			classes.forEach(function (c, i) {
				q += c.queryString;
			});

			return q;
		}
	}, {
		key: 'runQuerySync',
		value: function runQuerySync(q) {
			var holder = this;

			return new Promise(function (rs, rj) {

				var cycle = function cycle(qs) {
					var r, i, l;
					return regeneratorRuntime.async(function cycle$(context$4$0) {
						while (1) switch (context$4$0.prev = context$4$0.next) {
							case 0:
								r = null;
								context$4$0.prev = 1;
								i = 0, l = qs.length;

							case 3:
								if (!(i < l)) {
									context$4$0.next = 12;
									break;
								}

								t = setInterval(function () {
									process.stdout.write(clc.blueBright('.'));
								}, 25);

								context$4$0.next = 7;
								return regeneratorRuntime.awrap(holder.db.exec(qs[i]));

							case 7:
								r = context$4$0.sent;

								//___(clc.magentaBright(JSON.stringify(r)));
								clearInterval(t);

							case 9:
								i++;
								context$4$0.next = 3;
								break;

							case 12:
								context$4$0.next = 17;
								break;

							case 14:
								context$4$0.prev = 14;
								context$4$0.t0 = context$4$0['catch'](1);

								E(6, 'Query error', context$4$0.t0);

							case 17:
								return context$4$0.abrupt('return', r);

							case 18:
							case 'end':
								return context$4$0.stop();
						}
					}, null, this, [[1, 14]]);
				};

				var qs = q.trim().split('\n');

				cycle(qs)['catch'](function (e) {

					E(4, 'Query error', e, rj);
				}).then(function (r) {

					rs(qs.length + ' records have been inserted');
				});
			});
		}
	}, {
		key: 'runQuery',
		value: function runQuery(q) {
			var holder = this;
			return new Promise(function (rs, rj) {

				holder.db.exec(q, { 'class': 's' }).then(function (r) {

					rs(r);
				})['catch'](function (e) {

					E(3, 'Query execution', e, rj);
				});
			});
		}
	}, {
		key: 'importParsedData',

		/**
   *
   * @param data  : parsedData format
   * @param connConfig : (cnf.json).orient format
   * @returns {Promise}
   */
		value: function importParsedData(data) {

			var holder = this;

			return new Promise(function (rs, rj) {

				//simple input data check
				if (!data || !data.classes) {
					E(1, 'the data for import is incorrect', new Error('Error Importer#1: the data for import is incorrect'), rj);
				}

				//compose query
				try {
					var q = holder.composeQuery(data);
				} catch (e) {
					E(7, 'Query composition', e, rj);
					return e;
				}

				////choose a method
				//var runMethod=function(q=''){
				//	return new Promise(function(rs,rj){
				//		let msg='No supported import method specified in config';
				//		E(9,msg,new Error(msg),rj);
				//	});
				//};
				//
				//switch(holder.cnf.modules.importer.method){
				//	case 'rewrite':
				//		//todo: drop all non-system classes
				//		runMethod=holder.runQuery;
				//		break;
				//	default:
				//}

				//limit execution time
				var promises = [new Promise(function (rs, rj) {
					setTimeout(function () {
						rj(new Error('Error Importer#5: Timeout ' + holder.cnf.timeout + ' ms exceeded'));
					}, holder.cnf.timeout);
				}), holder.runQuery(q)];

				//get result
				Promise.race(promises).then(function (r) {
					if (t) clearInterval(t);
					rs(r);
				})['catch'](function (e) {
					E(2, 'Database communication', e, rj);
				});
			});
		}
	}]);

	return Importer;
})();

exports.Importer = Importer;
//___(clc.yellow(qs[i]));
//# sourceMappingURL=maps/importer.es7.js.map