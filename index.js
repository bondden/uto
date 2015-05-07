/* *
 * Author: Denis Bondarenko <bond.den@gmail.com>
 * Created: 26.03.2015 20:22
 */
'use strict';

var

	path    = require('path'),
	fs      = require('fs-extra'),
	compile = require('./lib/compiler.js').run,
	imp     = require('./lib/importer.js').importParsedData,
	minify  = require('node-json-minify'),

	parseContent=function(content){

		var
			d={
				"classes":[],
				"links":[]
			}
		;

		//removing comments
		content=content.replace(/^\s*'(.*)$/mgi,'');

		//finding classes
		var classes=content.match(
			/(abstract\s+)?class\s+([\w\.]+)(\s+extends\s+([\w\.]+))?(\s*\{\s*([#+\-]?[\w:]*((\(\))|(\[\])|(\{\}))?\s*)*\s*\})?/gi
		);
		classes.forEach(function(v){

			var c={
				"name":"",
				"superClass":"",
				"properties":[
					{
						"name":"package",
						"type":"STRING"
					}
				]
			};

			var tmp=content.split(v)[0].split('package');
			if(tmp.length>1){
				var pkg=tmp.pop();
				var pkgFind=pkg.match(/^\s*([\w]+)\s*\{\s*$/im);
				if(pkgFind && pkgFind.length>1){
					c.properties.package=pkgFind[1];
				}
			}

			if(/abstract/ig.test(v)){
				c.abstract=true;
			}

			var ext=v.match(/extends\s+([\w\.]+)/ig);
			if(ext && ext.length){
				c.superClass=ext[0].replace(/extends\s+/ig,'').trim();
			}

			var name=v.match(/class\s+([\w\.]+)(\s*|\s*\{\s*)/ig);
			if(name && name.length){
				c.name=name[0].replace(/class\s+/ig,'').trim().replace('{','').trim();
			}

			if(!c.name.length||!/\w/i.test(c.name)){
				return;
			}

			var contentString="";
			var cs=v.match(/{([\w\W\s\S]+)}/ig);
			if(cs && cs.length){
				contentString=cs[0].trim()
					.replace(/\t+/ig,'')
					.replace(/[ ]+/ig,' ')
					.replace(/((^\{)|(\}$))/img,'')
					.trim()
				;
			}

			//parsing class-specific properties
			//default type for any property is STRING
			var props=contentString.split('\n');
			if(props && props.length){
				props.forEach(function(v){

					if(!v.length){
						return;
					}

					//strip private properties
					var pName=v.trim();
					if(pName[0]=='-'){
						return;
					}

					pName=pName.replace(/^[+#]/img,'');

					var p={
						"name":pName,
						"type":"STRING"
					};

					var typedName=p.name.split(':');
					if(typedName&&typedName.length>1){
						p.name=typedName[0];
						p.type=typedName[1].trim().toUpperCase();
					}

					if(/\{$/img.test(p.name)){
						p.name=p.name.split('{')[0];
						if(p.type===''){
							p.type='EMBEDDED'
						}
					}

					if(/\[\]$/img.test(p.name)){
						p.name=p.name.split('[')[0];
						if(p.type===''){
							p.type='EMBEDDEDLIST'
						}
					}

					if(/\[\]$/img.test(p.type)){
						p.linkedClass=p.type.split('[')[0];
						p.type='LINKSET';
					}

					c.properties.push(p);

				});
			}

			//strip generic classes, that are included in ./d/init.odb.json
			if(
				c.name!=='V' &&
				c.name!=='E'
			){
				d.classes.push(c);
			}

		});

		var inheritance=content.match(
			/([\.\w]+)\s*\-[ultr]?\-\|>\s*(\w+)/gi
		);
		if(inheritance && inheritance.length){
			inheritance.forEach(function(v){

				var a=v.split(/\s*\-[ultr]?\-\|>\s*/gi);

				//handling dot
				a.forEach(function(va,ia,a){
					//todo: handle namespaces
					var vaa=va.split('.');
					if(Array.isArray(vaa) && vaa.length==2){
						a[ia]=vaa[1];
					}
				});

				//handling inheritance
				var className=a[0];
				var byClassName=function(classInstance){
					return className==classInstance.name;
				};
				var cl=d.classes.filter(byClassName);
				cl.forEach(function(vc){
					vc.superClass=a[1];
				});

			});
		}

		fs.writeFileSync(
			path.join(__dirname,'d','e.json'),
			minify(JSON.stringify(d))
		);

		return d;

	},

	parseFile=function(umlFile){

		var puml=fs.readFileSync(umlFile, 'utf8');
		return parseContent(puml);

	},

	compileImportJSON=function(umlFile,targetFile){

		var parsedData=parseFile(umlFile);

		var compiledData=minify(
			JSON.stringify(
				compile(parsedData)
			)
		);

		//floatProps
		[
			{
				"search":/"overSize":([0-9]+)(,?)/ig,
				"replace":'"overSize":$1.0$2'
			}
		].forEach(function(propRule){
			compiledData=compiledData.replace(propRule.search,propRule.replace);
		});

		fs.writeFileSync(targetFile,compiledData);

	},

	importDone=function(result){
		console.log(result);
	},

	importPUML=function(umlFile,cnfFile){

		//loadConfig
		var serverConfig=JSON.parse(fs.readFileSync(cnfFile,'utf8')).server;

		//parseData
		var parsedData=parseFile(umlFile);

		//importData
		imp(serverConfig,parsedData,importDone);

	}

;

module.exports={

	compileImportJSON:compileImportJSON,
	importPUML:importPUML

};
