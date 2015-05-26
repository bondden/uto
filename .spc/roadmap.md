# Road Map

## Milestones
```
0.1. puml2json converter
0.2. DB Generator
0.3. Web-Interface
0.4. Internal renderer
0.5. PlantUML from OrientDB generator
1.0. Web-page, docs
2.0. ESF requirements diagrams support
```
## Functional Requirements
```
0.1. It should create import.json file from *.puml class diagram
	0.1.1. It should parse *.puml class diagram file and store a temporary data
	0.1.2. It should save the result to import.json file
	0.1.3. It should check resulting file consistency.
	0.1.4. It should validate resulting file against JSON schema.
0.2. It should create DB schema classes from temporary parsed data
	0.2.1. It should connect to server
	0.2.2. It should detect if the database exists and, if yes, then use it, if no, then create it
	0.2.3. It should create classes, that do not exist
0.3. There should be a web-interface
	0.3.1. It should have as minimum two-column layout, where left column is for PlamtUML code textarea, right column - for rendered image.
	0.3.2. The rendered image should be updated on the code in textarea changes. To render image it should use remote service from the official PlantUML site example.
0.4. It should use own renderer.
	0.4.1. Dot renderer binaries should be installed on owned sever
	0.4.2. Web-interface should refer to owned server
0.5. It should generate PlantUML code from OrientDB database schema
	0.5.1. It should save it to a file, available for download from web-interface
	0.5.2. It should render the generated file to image, available for download from web-interface
1.0. There should be a documentation and a web-page
	1.0.1. There should be a web-page for the project
	1.0.2. It should contain the web-interface (req. 0.3.)
	1.0.3. There should be a descriptive documentation for the project
2.0. It should support import of ESF requirements diagrams to OrientDB records
```
