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
    clc = require('cli-color');

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
				throw new Error('Error Importer#4: Incorrect class ' + classData);
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

			cd.queryString = 'create class ' + c.name + c['extends'] + c.abstract + ';\n';

			classData.properties.forEach(function (p) {
				cd.queryString += 'create property ' + c.name + '.' + p.name + ' ' + p.type + ';\n';
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
						var t = JSON.parse(JSON.stringify(classes[j]));
						classes[j] = JSON.parse(JSON.stringify(classes[i]));
						classes[i] = t;
						break;
					}
				}
			}
			//

			classes.forEach(function (c, i) {
				q += c.queryString;
			});

			//q=`create class Tmp extends V;`;
			//q=`begin;${q}commit retry 5;`;

			q = 'begin;create class Tmp1 extends V;create class Tmp2 extends V;commit retry 10;';
			q = 'begin\ncreate class Tmp1 extends V\ncreate class Tmp2 extends V\ncommit retry 10';

			return q;
		}
	}, {
		key: 'runSubQuery',
		value: function runSubQuery() {
			return regeneratorRuntime.async(function runSubQuery$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
					case 'end':
						return context$2$0.stop();
				}
			}, null, this);
		}
	}, {
		key: 'runQuery',
		value: function runQuery(q) {
			var holder = this;
			return new Promise(function (rs, rj) {

				holder.db.exec(q).then(function (r) {

					rs(r);
				})['catch'](function (e) {

					L('Error Importer#3', 'er');
					L(e);
					rj(e);
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

				if (!data || !data.classes) {
					rj(new Error('Error Importer#1: the data for import is incorrect'));
				}

				try {

					var q = holder.composeQuery(data);
				} catch (e) {
					rj(e);
					return e;
				}

				holder.runQuery(q).then(function (r) {
					rs(r);
				})['catch'](function (e) {
					L('Error Importer#2', 'er');
					L(e);
					rj(new Error('Error Importer#2: database communication'));
				});
			});
		}
	}]);

	return Importer;
})();

exports.Importer = Importer;
//# sourceMappingURL=maps/importer.es7.js.map