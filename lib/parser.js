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

var fs = require('fs'),
    L = UtilLib.Util.log;
/**
 * Parses *.puml to temporary json format and to memory
 */

var Parser = (function () {
	function Parser(config) {
		_classCallCheck(this, Parser);

		this.cnf = config;
		this.parsedData = false;
		this.init();
	}

	_createClass(Parser, [{
		key: 'init',
		value: function init() {}
	}, {
		key: 'loadPumlFile',

		//loadParsedData(){}

		value: function loadPumlFile(srcFile) {
			return new Promise(function (resolve, reject) {
				try {
					if (!fs.existsSync(srcFile)) {
						reject(new Error('File does not exist.'));
					}
					fs.readFile(srcFile, function (e, d) {
						if (e) {
							L('Error #2', 'er');
							L(e);
							reject(e);
						}

						//console.log(srcFile+' contents: \n'+clc.blackBright.italic(d));
						//console.log(srcFile+' contents: \n'+`${d}`.dim.grey+'\n');

						resolve(d);
					});
				} catch (e) {
					reject(e);
				}
			});
		}
	}, {
		key: 'parseLoadedSource',
		value: function parseLoadedSource(content) {

			var d = {
				'classes': [],
				'links': []
			};

			//removing comments
			try {
				content = (content + '').replace(/^\s*'(.*)$/mgi, '');
			} catch (e) {
				L('Error #1', 'er');
				L(e);
				throw e;
			}

			//finding classes
			var classes = content.match(/(abstract\s+)?class\s+([\w\.]+)(\s+extends\s+([\w\.]+))?(\s*\{\s*([#+\-]?[\w:]*((\(\))|(\[\])|(\{\}))?\s*)*\s*\})?/gi);

			classes.forEach(function (v) {

				var c = {
					'name': '',
					'superClass': '',
					'properties': [{
						'name': 'package',
						'type': 'STRING'
					}]
				};

				var tmp = content.split(v)[0].split('package');
				if (tmp.length > 1) {
					var pkg = tmp.pop();
					var pkgFind = pkg.match(/^\s*([\w]+)\s*\{\s*$/im);
					if (pkgFind && pkgFind.length > 1) {
						c.properties['package'] = pkgFind[1];
					}
				}

				if (/abstract/ig.test(v)) {
					c.abstract = true;
				}

				var ext = v.match(/extends\s+([\w\.]+)/ig);
				if (ext && ext.length) {
					c.superClass = ext[0].replace(/extends\s+/ig, '').trim();
				}

				var name = v.match(/class\s+([\w\.]+)(\s*|\s*\{\s*)/ig);
				if (name && name.length) {
					c.name = name[0].replace(/class\s+/ig, '').trim().replace('{', '').trim();
				}

				if (!c.name.length || !/\w/i.test(c.name)) {
					return;
				}

				var contentString = '';
				var cs = v.match(/{([\w\W\s\S]+)}/ig);
				if (cs && cs.length) {
					contentString = cs[0].trim().replace(/\t+/ig, '').replace(/[ ]+/ig, ' ').replace(/((^\{)|(\}$))/img, '').trim();
				}

				//parsing class-specific properties
				//default type for any property is STRING
				var props = contentString.split('\n');
				if (props && props.length) {
					props.forEach(function (v) {

						if (!v.length) {
							return;
						}

						//strip private properties
						var pName = v.trim();
						if (pName[0] == '-') {
							return;
						}

						pName = pName.replace(/^[+#]/img, '');

						var p = {
							'name': pName,
							'type': 'STRING'
						};

						var typedName = p.name.split(':');
						if (typedName && typedName.length > 1) {
							p.name = typedName[0];
							p.type = typedName[1].trim().toUpperCase();
						}

						if (/\{$/img.test(p.name)) {
							p.name = p.name.split('{')[0];
							if (p.type === '') {
								p.type = 'EMBEDDED';
							}
						}

						if (/\[\]$/img.test(p.name)) {
							p.name = p.name.split('[')[0];
							if (p.type === '') {
								p.type = 'EMBEDDEDLIST';
							}
						}

						if (/\[\]$/img.test(p.type)) {
							p.linkedClass = p.type.split('[')[0];
							p.type = 'LINKSET';
						}

						c.properties.push(p);
					});
				}

				//strip generic classes, that are included in ./d/init.odb.json
				if (c.name !== 'V' && c.name !== 'E') {
					d.classes.push(c);
				}
			});

			var inheritance = content.match(/([\.\w]+)\s*\-[ultr]?\-\|>\s*(\w+)/gi);
			if (inheritance && inheritance.length) {
				inheritance.forEach(function (v) {

					var a = v.split(/\s*\-[ultr]?\-\|>\s*/gi);

					//handling dot
					a.forEach(function (va, ia, a) {
						//todo: handle namespaces
						var vaa = va.split('.');
						if (Array.isArray(vaa) && vaa.length == 2) {
							a[ia] = vaa[1];
						}
					});

					//handling inheritance
					var className = a[0];
					var byClassName = function byClassName(classInstance) {
						return className == classInstance.name;
					};
					var cl = d.classes.filter(byClassName);
					cl.forEach(function (vc) {
						vc.superClass = a[1];
					});
				});
			}

			//console.log('\n//parseData'.bold+`${d}`.blue+'\n');

			return d;
		}
	}, {
		key: 'parse',

		/*saveToFile(targetFile){
  	}*/

		value: function parse(pumlFile) {

			//console.log('//at Parser.parse');

			var holder = this;

			return new Promise(function (resolve, reject) {

				//console.log('//at Parser.parse Promise');

				holder.loadPumlFile(pumlFile).then(function (d) {

					//console.log('\nLoaded contents: \n\n'.green+`${d}`.dim.grey+'\n');

					holder.parsedData = holder.parseLoadedSource(d);

					if (!holder.parsedData) {
						reject(new Error('Error parsing file ' + pumlFile));
					} else {
						resolve(holder.parsedData);
					}
				})['catch'](function (e) {
					reject(new Error('Error loading file ' + pumlFile));
				});

				/*let saved=await this.saveToFile();
    if(!saved){
    	reject(new Error('Error saving file '+pumlFile));
    }*/
			});
		}

		//parseToFile(pumlFile,targetFile){}

	}, {
		key: 'getParsedData',
		get: function get() {
			return this.parsedData;
		}
	}]);

	return Parser;
})();

exports.Parser = Parser;
//# sourceMappingURL=maps/parser.es7.js.map