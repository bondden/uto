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

var fs = require('fs-extra'),
    path = require('path'),
    minify = require('node-json-minify'),
    L = UtilLib.Util.log;
/**
 * Compiles parsed *.puml data to OrientDB import.json
 */

var Compiler = (function () {
	function Compiler() {
		var cnf = arguments[0] === undefined ? false : arguments[0];

		_classCallCheck(this, Compiler);

		this.cnf = cnf;
		this.init();
	}

	_createClass(Compiler, [{
		key: 'init',
		value: function init() {}
	}, {
		key: 'compile',

		//loadParsedData(){}

		value: function compile(data, targetFile) {

			//console.log('//at compile');

			var holder = this;
			var r = {
				'compiled': false,
				'saved': false,
				'valid': false,
				'error': null
			};

			return new Promise(function (resolve, reject) {

				var s = holder.compileStr(data);

				if (typeof s === 'string') {
					r.compiled = true;
				}

				//console.log('//after compileStr');

				holder.saveStr(s, targetFile).then(function (d) {

					r.saved = true;

					if (holder.validateJson(targetFile, holder.cnf.path.schemaFile)) {
						r.valid = true;
						resolve(r);
					} else {
						r.error = new Error('Validation against schema failed');
						reject(r);
					}
				})['catch'](function (e) {
					L('Error #1', 'er');
					L(e);
					reject(e);
				});
			});
		}
	}, {
		key: 'compileStr',
		value: function compileStr(data) {

			var defaultData = {
				'root': {
					'clusters': [],
					'schema': {
						'version': 2,
						'classes': []
					},
					'records': [],
					'indexes': [],
					'manualIndexes': []
				},
				'cluster': {
					'id': null,
					'name': null
				},
				'schemaClass': {
					'name': null,
					'defaultClusterId': null,
					'clusterIds': [],
					'superClass': null,
					'clusterSelection': 'round-robin',
					'properties': []
				},
				'classProperty': {
					'name': null,
					'type': 'STRING',
					'mandatory': true,
					'notNull': true,
					'collate': 'default',
					'linkedClass': 'Basic'
				},
				'record': {
					'@type': 'd',
					'version': 0,
					'name': null,
					'shortName': null,
					'defaultClusterId': null,
					'clusterIds': [],
					'clusterSelection': 'round-robin',
					'overSize': 0.0,
					'strictMode': false,
					'abstract': false,
					'properties': [],
					'superClass': null,
					'customFields': null,
					'fieldTypes': 'overSize=f,properties=e'
				},
				'recordProperty': {
					'@type': 'd',
					'version': 0,
					'name': null,
					'type': null,
					'globalId': null,
					'mandatory': false,
					'readonly': false,
					'notNull': false,
					'min': null,
					'max': null,
					'regexp': null,
					'linkedClass': null,
					'customFields': null,
					'collate': 'default'
				}
			},
			    rules = {

				'meta': {
					'clusterStartId': 10 //,
					//"schemaStartVersion":1
				},

				'templates': {
					'root': {
						'info': function info(d) {
							return {
								'name': d.info.name,
								'schema-version': d.schema.version,
								'default-cluster-id': 3,
								'exporter-version': 11,
								'engine-version': '2.0.8',
								'engine-build': 'UNKNOWN@r$buildNumber; 2015-04-22 20:47:49+0000',
								'storage-config-version': 14,
								'mvrbtree-version': 3,
								'schemaRecordId': '#0:1',
								'indexMgrRecordId': '#0:2'
							};
						},
						'clusters': function clusters(d) {
							return d.clusters;
						},
						'schema': {
							'version': function version(d) {
								return d.schema.version;
							},
							'classes': function classes(d) {
								return d.classes;
							}
						},
						'records': function records(d) {
							return d.records;
						},
						'indexes': function indexes(d) {
							return d.indexes;
						},
						'manualIndexes': function manualIndexes(d) {
							return d.manualIndexes;
						}
					},
					'cluster': function cluster(d) {
						return {
							'name': d.name,
							'id': d.id
						};
					},
					'schemaClass': function schemaClass(d) {
						return {
							'name': d.name,
							'default-cluster-id': d.defaultClusterId,
							'cluster-ids': d.clusterIds,
							'super-class': d.superClass,
							'cluster-selection': d.clusterSelection,
							'properties': d.properties
						};
					},
					'classProperty': function classProperty(d) {
						var r = {
							'name': d.name,
							'type': d.type,
							'mandatory': d.mandatory,
							'not-null': d.notNull,
							'collate': d.collate
						};
						if (['EMBEDDEDLIST', 'EMBEDDEDSET', 'EMBEDDEDMAP', 'LINKLIST', 'LINKSET', 'LINKMAP', 'LINKBAG'].indexOf(d.type) !== -1) {
							r['linked-class'] = 'Basic';
						}
						return r;
					},
					'record': function record(d) {
						return {
							'@type': 'd',
							'@version': d.version,
							'name': d.name,
							'shortName': d.shortName,
							'defaultClusterId': d.defaultClusterId,
							'clusterIds': d.clusterIds,
							'clusterSelection': d.clusterSelection,
							'overSize': d.overSize,
							'strictMode': d.strictMode,
							'abstract': d.abstract,
							'properties': d.properties,
							'superClass': d.superClass,
							'customFields': d.customFields,
							'@fieldTypes': d.fieldTypes
						};
					},
					'recordProperty': function recordProperty(d) {
						return {
							'@type': 'd',
							'@version': d.version,
							'name': d.name,
							'type': d.type,
							'globalId': d.globalId,
							'mandatory': d.mandatory,
							'readonly': d.readonly,
							'notNull': d.notNull,
							'min': d.min,
							'max': d.max,
							'regexp': d.regexp,
							'linkedClass': d.linkedClass,
							'customFields': d.customFields,
							'collate': d.collate
						};
					}
				}
			},
			    compileTpl = function compileTpl(tplId, data) {

				var tpl = rules.templates[tplId],
				    tmpData = JSON.parse(JSON.stringify(defaultData[tplId]));

				for (var p in data) {
					if (tmpData.hasOwnProperty(p)) {
						tmpData[p] = data[p];
					} else {
						Object.defineProperty(tmpData, p, {
							value: data[p],
							writable: true,
							configurable: true
						});
					}
				}

				return tpl(tmpData);
			},
			    mainRule = function mainRule(parsedData) {

				var initRaw = fs.readFileSync(path.join(__dirname, '../d', 'init.odb.json'));
				var data = JSON.parse(initRaw);

				data.info['schema-version']++;
				data.schema.version++;

				//compiling classes;
				parsedData.classes.forEach(function (v, i) {

					//compiling properties
					v.properties.forEach(function (vp, ip) {
						v.properties[ip] = compileTpl('classProperty', vp);
					});

					var clusterId = -1;

					if (v.hasOwnProperty('abstract') && v.abstract) {

						delete v.abstract;
					} else {

						clusterId = rules.meta.clusterStartId + i + 1;

						//adding a cluster for the class
						data.clusters.push(compileTpl('cluster', {
							'name': v.name.toLowerCase(),
							'id': clusterId
						}));
					}

					v.defaultClusterId = clusterId;
					v.clusterIds = [clusterId];

					//adding compiled class
					data.schema.classes.push(compileTpl('schemaClass', v));
				});

				return data;
			};

			var parsedData = mainRule(data);

			var compiledData = minify(JSON.stringify(parsedData));

			//floatProps
			[{
				'search': /"overSize":([0-9]+)(,?)/ig,
				'replace': '"overSize":$1.0$2'
			}].forEach(function (propRule) {
				compiledData = compiledData.replace(propRule.search, propRule.replace);
			});

			return compiledData;
		}
	}, {
		key: 'saveStr',
		value: function saveStr(str, targetFile) {

			return new Promise(function (resolve, reject) {

				try {

					fs.writeFile(targetFile, str, function (e) {

						if (e) {
							console.log(e);
							reject(e);
						}

						resolve(true);
					});
				} catch (e) {
					console.log(e);
					reject(e);
				}
			});
		}
	}, {
		key: 'validateJson',
		value: function validateJson(fileName, schemaFileName) {

			//console.log('//at validateJson');

			var proc = function proc() {
				var validator, schemaRaw, schema, jRaw, json, validate, validationResult;
				return regeneratorRuntime.async(function proc$(context$3$0) {
					while (1) switch (context$3$0.prev = context$3$0.next) {
						case 0:
							validator = require('is-my-json-valid');
							context$3$0.next = 3;
							return regeneratorRuntime.awrap(fs.readFileSync(schemaFileName));

						case 3:
							schemaRaw = context$3$0.sent;
							schema = JSON.parse(schemaRaw);
							context$3$0.next = 7;
							return regeneratorRuntime.awrap(fs.readFileSync(fileName));

						case 7:
							jRaw = context$3$0.sent;
							json = JSON.parse(jRaw);
							validate = validator(schema);
							validationResult = validate(json);

							if (!validationResult) {
								L(validate.errors);
							}

							return context$3$0.abrupt('return', validationResult);

						case 13:
						case 'end':
							return context$3$0.stop();
					}
				}, null, this);
			};

			return new Promise(function (resolve, reject) {

				if (proc()) {
					resolve(true);
				} else {
					reject(false);
				}
			});
		}
	}]);

	return Compiler;
})();

exports.Compiler = Compiler;

//cinsole.log('\nvalidateJson.schemaRaw:\n'.cyan+`${schemaRaw}`+'\n');

//console.log('1. schema parsed'.cyan);

//console.log('2. file parsed');

//console.log('3. result is ready');
//# sourceMappingURL=maps/compiler.es7.js.map