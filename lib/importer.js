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

/**
 * Connects to OrientDb server.
 * Creates DB schema or adds classes to existent schema from parsedData.
 */

var _libUtil = require('../lib/util');

var UtilLib = _interopRequireWildcard(_libUtil);

var fs = require('fs'),
    L = UtilLib.Util.log,
    clc = require('cli-color'),
    ___ = console.log;

var Importer = (function () {
	function Importer(db, cnf) {
		_classCallCheck(this, Importer);

		this.db = db;
		this.cnf = cnf;
		this.data = {};
		this.classInsertAttempts = [];
	}

	_createClass(Importer, [{
		key: 'insertClassProperty',
		value: function insertClassProperty(className, propData) {

			___(clc.yellow('\t\t\t<insertClassProperty_ofClass_' + className) + '{' + clc.whiteBright(propData.name + ':' + propData.type) + '}>');

			var holder = this;
			//var holder=this;
			return new Promise(function (resolve, reject) {

				resolve(true);

				var q = 'create property ' + className + '.' + propData.name + ' ' + propData.type;
				___(q);

				holder.db.exec(q).then(function (r) {

					___(clc.greenBright('\t<!-- prop created ' + className + '.' + propData.name + ' with ' + r.results.length + ' results') + ' -->');
					___(r);
					___('\n');

					___(clc.yellow('\t\t\t</insertClassProperty_ofClass_' + className) + '{' + clc.whiteBright(propData.name + ':' + propData.type) + '}>');

					resolve(r);
				})['catch'](function (e) {

					L('Error Importer#3', 'er');
					L(e);
					L('query: ' + q);

					//todo: normal logging or remove in open version
					var date = new Date();
					var t = date.toTimeString();
					fs.appendFile(holder.cnf.path.logFile, '[' + t + '] ' + __filename + ': Error#3; query: "' + q + '"; raw: ' + JSON.stringify(e) + '\n');

					___(clc.yellow('\t\t\t</insertClassProperty_ofClass_' + className) + '{' + clc.whiteBright(propData.name + ':' + propData.type) + '}>');
					reject(e);
				});
			});
		}
	}, {
		key: 'classExists',
		value: function classExists(className) {

			___(clc.white('\t<classExists_') + clc.whiteBright(className) + '>');

			var holder = this;

			return new Promise(function (resolve, reject) {

				___(clc.white('\t\t<classExistsPromiseOf_') + clc.whiteBright(className) + '>');

				holder.db['class'].get(className).then(function (classPtr) {

					___(clc.white('\n<!-- classExists.exists ' + className) + ' -->');

					___(clc.white('\t\t</classExistsPromiseOf_') + clc.whiteBright(className) + '>');
					___(clc.white('\t</classExists_') + clc.whiteBright(className) + '>');
					resolve(classPtr);
				})['catch'](function (e) {
					___(clc.white('\t\t</classExistsPromiseOf_') + clc.whiteBright(className) + '>');
					___(clc.white('\t</classExists_') + clc.whiteBright(className) + '>');
					resolve(false);
				});
			});
		}
	}, {
		key: 'insertClassCheckless',
		value: function insertClassCheckless(classData) {

			___('\n\t<insertClassCheckless_' + clc.whiteBright.bold(classData.name) + '>');

			var holder = this;

			return new Promise(function (resolve, reject) {

				___('\n\t\t<insertClassChecklessPromiseOf_' + clc.whiteBright.bold(classData.name) + '>');

				//do not repeat attempts

				___('<!--');
				___(holder.classInsertAttempts);
				___('-->');

				var tried = holder.classInsertAttempts.find(function (el, i, a) {
					___(clc.redBright('<!-- ' + el + ' <-> ' + classData.name + ' -->'));
					return el === classData.name;
				});
				if (tried) {
					___(clc.white('\t</PromiseOf_') + clc.whiteBright(classData.name) + '>');
					___(clc.white('</insertClass_') + clc.whiteBright.bold(classData.name) + '>\n');
					resolve(classData);
					return;
				}
				holder.classInsertAttempts.push(classData.name);
				//

				var c = {
					'name': classData.name,
					'extends': '',
					'abstract': ''
				};
				if (classData.hasOwnProperty('superClass') && classData.superClass) {
					c['extends'] = ' extends ' + classData.superClass;
				}
				if (classData.hasOwnProperty('abstract') && classData.abstract) {
					c.abstract = ' ABSTRACT';
				}
				var q = 'create class ' + c.name + c['extends'] + c.abstract;

				___(clc.whiteBright('\nq: ' + q));

				holder.db.exec(q).then(function (r) {

					___(clc.green('\n<!-- created class ' + classData.name) + ' -->');
					___(r);

					//holder.db.class.get(classData.name).then(function(recentClass){

					var promises = [];
					classData.properties.forEach(function (p) {
						promises.push(holder.insertClassProperty(classData.name, p));
					});
					promises.push(new Promise(function (rs, rj) {
						setTimeout(function () {
							rj(new Error('Timeout ' + holder.cnf.timeout + ' ms'));
						}, holder.cnf.timeout);
					}));

					Promise.all(promises).then(function (r) {

						___('<!-- ' + clc.magentaBright('props ' + classData.name) + ' -->');
						___('\n\t\t</insertClassChecklessPromiseOf_' + clc.whiteBright.bold(classData.name) + '>');
						___('\n\t</insertClassCheckless_' + clc.whiteBright.bold(classData.name) + '>');
						resolve(r);
					})['catch'](function (e) {

						L('Error Importer#4', 'er');
						L(e);
						L('props of ' + classData.name);
						L();
						___('\n\t\t</insertClassChecklessPromiseOf_' + clc.whiteBright.bold(classData.name) + '>');
						___('\n\t</insertClassCheckless_' + clc.whiteBright.bold(classData.name) + '>');
						reject(e);
					});
				})['catch'](function (e) {

					L('Error Importer#5', 'er');
					L(e);
					___('\n\t\t</insertClassChecklessPromiseOf_' + clc.whiteBright.bold(classData.name) + '>');
					___('\n\t</insertClassCheckless_' + clc.whiteBright.bold(classData.name) + '>');
					reject(e);
				});

				___('\n');
			});
		}
	}, {
		key: 'insertClass',
		value: function insertClass(classData) {

			___(clc.white('<insertClass_') + clc.whiteBright.bold(classData.name) + '>');

			var holder = this;

			return new Promise(function (resolve, reject) {

				___(clc.white('\t<PromiseOf_') + clc.whiteBright(classData.name) + '>');

				holder.classExists(classData.name).then(function (r) {

					___('\n<!-- class ' + classData.name + ' exists: ' + clc.cyan(r) + ' -->');

					if (r) {

						___('<!-- ' + clc.magentaBright('exists ') + classData.name + '-->');
						___(clc.white('\t</PromiseOf_') + clc.whiteBright(classData.name) + '>');
						___(clc.white('</insertClass_') + clc.whiteBright.bold(classData.name) + '>\n');
						resolve(r);
					} else {

						___('<!-- ' + clc.magentaBright('absent ') + classData.name + ' -->');

						if (classData.hasOwnProperty('superClass') && classData.superClass) {

							___('\n<!-- ' + clc.blue('class ') + classData.name + clc.blueBright('.hasSuper') + '(' + classData.superClass + ') -->');

							var sClass = holder.data.classes.find(function (el, i, a) {
								return el.name === classData.superClass;
							});

							___('<!-- ' + clc.blueBright('sClass: ') + (sClass ? sClass.name : 'No') + ' -->');

							if (sClass) {
								holder.insertClass(sClass).then(function (r) {

									___('<!-- ' + clc.green('inserted parent ' + r) + ' -->');

									holder.insertClassCheckless(classData).then(function (r1) {

										___('<!-- ' + clc.green('inserted with parent ' + r1) + ' -->');
										___(clc.white('\t</PromiseOf_') + clc.whiteBright(classData.name) + '>');
										___(clc.white('</insertClass_') + clc.whiteBright.bold(classData.name) + '>\n');
										resolve(r1);
									})['catch'](function (e) {

										L('Error Importer#12', 'er');
										L(e);
										___(clc.white('\t</PromiseOf_') + clc.whiteBright(classData.name) + '>');
										___(clc.white('</insertClass_') + clc.whiteBright.bold(classData.name) + '>\n');
										reject(e);
									});
								})['catch'](function (e) {

									L('Error Importer#10', 'er');
									L(e);
									___(clc.white('\t</PromiseOf_') + clc.whiteBright(classData.name) + '>');
									___(clc.white('</insertClass_') + clc.whiteBright.bold(classData.name) + '>\n');
									reject(e);
								});
							}
						} else {

							___(clc.blue('\nclass ') + classData.name + clc.blueBright('.hasSuper') + '(' + clc.red('false') + ')');

							holder.insertClassCheckless(classData).then(function (r) {

								___('<!-- ' + clc.green('inserted parentless ' + r) + ' -->');
								___(clc.white('\t</PromiseOf_') + clc.whiteBright(classData.name) + '>');
								___(clc.white('</insertClass_') + clc.whiteBright.bold(classData.name) + '>\n');
								resolve(r);
							})['catch'](function (e) {

								L('Error Importer#11', 'er');
								L(e);
								___(clc.white('\t</PromiseOf_') + clc.whiteBright(classData.name) + '>');
								___(clc.white('</insertClass_') + clc.whiteBright.bold(classData.name) + '>\n');
								reject(e);
							});
						}
					}
				})['catch'](function (e) {
					L('Error Importer#30', 'er');
					L(e);
					___(clc.white('\t</PromiseOf_') + clc.whiteBright(classData.name) + '>');
					___(clc.white('</insertClass_') + clc.whiteBright.bold(classData.name) + '>\n');
					reject(e);
				});
			});

			//___(clc.white('</insertClass_')+clc.whiteBright.bold(classData.name)+'>\n');
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
			holder.data = data;
			holder.classInsertAttempts = [];

			return new Promise(function (resolve, reject) {

				try {
					(function () {

						if (!data || !data.classes) {
							reject(new Error('Error importing data: the data is incorrect.'));
						}

						var promises = [];
						data.classes.forEach(function (classData) {
							promises.push(holder.insertClass(classData));
						});
						promises.push(new Promise(function (rs, rj) {
							setTimeout(function () {
								rj(new Error('Timeout ' + holder.cnf.timeout + ' ms'));
							}, holder.cnf.timeout);
						}));

						Promise.all(promises).then(function (r) {

							___('all classes resolved'.green);
							resolve(r);
						})['catch'](function (e) {

							L('Error Importer#6', 'er');
							L(e);
							reject(new Error('Error in database communication #1'));
						});
					})();
				} catch (e) {

					L('Error Importer#7', 'er');
					L(e);
					reject(new Error('Error in database communication #2'));
				}
			});
		}
	}]);

	return Importer;
})();

exports.Importer = Importer;
//# sourceMappingURL=maps/importer.es7.js.map