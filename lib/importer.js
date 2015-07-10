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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _libUtil = require('../lib/util');

var UtilLib = _interopRequireWildcard(_libUtil);

var fs = require('fs'),
    L = UtilLib.Util.log,
    clc = require('cli-color'),
    ___ = console.log,
    __p = process.stdout.write,
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

//todo: transaction style

var Importer = (function () {
	function Importer(db, cnf) {
		_classCallCheck(this, Importer);

		this.db = db;
		this.cnf = cnf;
	}

	_createClass(Importer, [{
		key: 'generalizationSort',
		value: function generalizationSort(arr) {
			var parent = arguments.length <= 1 || arguments[1] === undefined ? 'superClass' : arguments[1];
			var name = arguments.length <= 2 || arguments[2] === undefined ? 'name' : arguments[2];

			function branch(o, a) {
				for (var i = 0, l = a.length; i < l; i++) {
					if (a[i][parent] === o[name]) {
						a[i].level = o.level + 1;
						branch(a[i], a);
					}
				}
			}

			var a = JSON.parse(JSON.stringify(arr));
			return new Promise(function (rs, rj) {

				for (var i = 0, l = a.length; i < l; i++) {

					//level 0
					a[i].level = a[i][parent] ? 1 : 0;

					if (a[i].level) {
						a[i].hasParentInTheArr = a.find(function (el, i, arrPtr) {
							return el[name] === a[i][parent];
						});
						if (!a[i].hasParentInTheArr) {
							a[i].level = 0;
						}
					}

					//level>0
					if (a[i].level) {}

					branch(a[i], a);
				}

				var tops = a.sort(function (x, y) {
					return x.level - y.level;
				}).map(function (o) {
					var _ref;

					return (_ref = {}, _defineProperty(_ref, name, o[name]), _defineProperty(_ref, parent, o[parent]), _defineProperty(_ref, 'l', o.level), _ref);
				});

				rs(tops);
			});
		}
	}, {
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
		key: 'cleanDb',
		value: function cleanDb(classes) {
			var holder = this;

			return new Promise(function (rs, rj) {

				var q = '';
				var ce = [];

				holder.db['class'].list().then(function (existentClasses) {

					existentClasses = existentClasses.map(function (v) {
						return {
							'name': v.name,
							'superClass': v.superClass
						};
					});

					existentClasses.forEach(function (c) {
						var isSys = holder.cnf.modules.importer.systemClasses.find(function (el, i, a) {
							return el === c.name;
						});
						if (isSys) return;
						ce.push(c);
					});

					//___(clc.magenta('\nbefore sort'));
					//___(ce);
					//___('\n');

					holder.generalizationSort(ce)['catch'](function (e) {
						E(11, 'sorting', e, rj);
					}).then(function (a) {

						//___(clc.magenta('\nafter sort'));
						//___(a);
						//___('\n');

						for (var i = a.length - 1; i >= 0; i--) {
							var nm = a[i].name;
							q += 'truncate class ' + nm + ' UNSAFE\n';
							q += 'drop class ' + nm + '\n';
						}

						//L(clc.yellow('q:\n'+q)+'\n');

						rs(q);
					});
				})['catch'](function (e) {
					E(10, 'Listing classes', e, rj);
				});
			});
		}
	}, {
		key: 'composeQuery',
		value: function composeQuery(data) {

			var holder = this;

			return new Promise(function (rs, rj) {

				var q = '';
				//it not nessessary to have classes to import, if we want just to clean DB
				//if(data.classes.length===0){
				//	L('No classes to import');
				//	rs(q);
				//	return q;
				//}

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

				holder.cleanDb(classes).then(function (dropQuery) {

					q += dropQuery;

					classes.forEach(function (c, i) {
						q += c.queryString;
					});

					//Schema changes are not transactional
					//q=`begin\n${q}\ncommit`;
					rs(q);
				})['catch'](function (e) {
					E(11, 'Composing query', e, rj);
				});
			});
		}
	}, {
		key: 'runQuery',
		value: function runQuery(q) {
			var holder = this;
			return new Promise(function (rs, rj) {

				//rs('STOPPED');
				//return('STOPPED');

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
   * connConfig : (cnf.json).orient format
   * @returns {Promise}
   */
		value: function importParsedData(data) {

			var holder = this;

			return new Promise(function (rs, rj) {

				//simple input data check
				if (!data || !data.classes) {
					var msg = 'the data for import is incorrect';
					E(1, msg, new Error(msg), rj);
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
				//		runMethod=holder.runQuery;
				//		break;
				//	default:
				//}

				//compose query and run
				holder.composeQuery(data)['catch'](function (eq) {
					E(7, 'Query composition', eq, rj);
				}).then(function (q) {

					//limit execution time
					var promises = [new Promise(function (rs, rj) {
						setTimeout(function () {
							rj(new Error('Error Importer#5: Timeout ' + holder.cnf.timeout + ' ms exceeded'));
						}, holder.cnf.timeout);
					}), holder.runQuery(q)];

					//get result
					Promise.race(promises)['catch'](function (e) {
						E(2, 'Database communication', e, rj);
					}).then(function (r) {
						if (t) clearInterval(t);
						rs(r);
					});
				});
			});
		}
	}]);

	return Importer;
})();

exports.Importer = Importer;
//# sourceMappingURL=maps/importer.es7.js.map