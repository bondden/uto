# UTO

Node.JS module for [**PlantUML** Class Diagram](http://plantuml.sourceforge.net/classes.html) **to** [**OrientDB** Schema](http://orientdb.com/docs/last/Schema.html) (import.json) conversion.

## Installation

```sh
npm install uto
```

## Technology Basics

- [ ] todo: GraphDB Architecture Description 

1) Create a [domain model](http://www.uml-diagrams.org/class-diagrams-overview.html#domain-model-diagram) with PlantUML class diagram, using either  
	* [your favourite tool](http://plantuml.sourceforge.net/running.html) or
	* [online PlantUML Editor](http://itms.pro/).

2) Save file as *.puml.

3) Convert to import.json for OrientDB with the **u2j**:

```sh
node u2j PATH_TO_PLANTUML_CLASS_DIAGRAM.puml PATH_TO_IMPORT.json
```

4) Import to OrientDB:

```sh
create database plocal:PATH_TO_DB_DIRECTORY/DB_NAME
import PATH_TO_IMPORT.json
```

## Supported PlantUML Features

* Packages
* Package nesting
* Classes
* Class inheritance both with
	* ```extends``` keyword
	* and ```--|>``` arrow variations
* Attributes
* Attribute types
* Comments filtering

The recent edition of the PlantUML reference is [downloadable in PDF-format](http://plantuml.sourceforge.net/PlantUML_Language_Reference_Guide.pdf) from the official [PlantUML site](http://plantuml.sourceforge.net).

## PlantUML Example

```java
@startuml

package Core{
	class Basic extends V{
		+dateCreated:datetime
		+dateChanged:datetime
	}
	class	Link extends E{
		+type
	}
}

package Storage{

	package Law{

		abstract class Body extends Basic{
			+langs:string[]
			+contacts:Contact[]
		}

		class Legal extends Body{
			+nameShort
			+nameFull
			+stockLinks
		}
		class Person extends Body{
			+name
			+familyName
			+dateBirth
			+dateDeath
		}
		class Contact extends Basic{
			+contactName
			+reactionInterval
		}

	}

	package Data{
		class DataItem extends Basic
		class DataItemRevision extends DataItem
	}

}

package Service {
	Client -u-|> Legal
}

@enduml
```

## Resulting File

## Road Map
|Version  |Status     |Functionality |
|---      |---        |---           |
|0.1      |released   |Schema validated PlantUML to import.json conversion. Modules: ```index```, ```compiler``` |
|0.2      |           |Automatic DB generator. Modules: ```dbgen``` |
|0.3      |           |Interactive front-end. External graphic renderer. Modules: ```server```, ```assets``` |
|0.4      |           |Internal server-side graphic renderer. Modules: ```plantuml-r``` |
|0.5      |           |Export to PlantUML. Modules: ```orient-puml``` |
|1.0      |           |Style guide, page. Modules: ```^assets```|
|2.0      |           |ESF requirements diagrams support.|

## License

The MIT License (MIT)

Copyright (c) 2015 [Denis Bondarenko](https://github.com/bondden)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
