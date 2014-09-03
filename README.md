json-easy-filter
================

Javascript node module for programatic filtering and validation of Json objects.

For other similar projects see [Links](#Links) section.

## Installation
```shell
$ npm install json-easy-filter
```

## Usage
```js
var jef = require('json-easy-filter');

var obj = {
		v1: 100,
		v2: 200,
		v3: {
				v4: 300,
				v5: 400
		}
};
var numbers = new jef(obj).filter(function(node) {
		if (typeof node.value==='number') {
			return node.key + ' ' + node.value;
		}
	});

console.log(numbers);
>> [ 'v1 100', 'v2 200', 'v4 300', 'v5 400' ]
```
`filter()` will recursively traverse each node in `obj` and trigger the callback method.
`node` parameter received by callback is a wrapper around the real Js object which can be accessed using `node.key` and `node.value`.

Check out the examples and [API](#API) for more info.


## Examples
Use the <a href="https://raw.githubusercontent.com/gliviu/json-easy-filter/master/tests/sampleData1.js" target="_blank">sample</a> data to follow this section.

### Filter
&#35;1. node.has()

```js
var res = new Jef(sample1).filter(function(node) {
	if (node.has('username')) {
		return node.value.username;
	}
});
console.log(res);

>> [ 'john', 'adams', 'lee', 'scott', null ] 
```
&#35;2. node.value
```js
var res = new Jef(sample1).filter(function(node) {
	if (node.has('salary') && node.value.salary > 200) {
		return node.value.username + ' ' + node.value.salary;
	}
});
console.log(res);
>> [ 'lee 300', 'scott 400' ] 
```

&#35;3. Paths, node.has(RegExp), level
```js
var res = new Jef(sample1).filter(function(node){
	if(node.has(/^(phone|email|city)$/)){
		return 'contact: '+node.path;
	}
	if(node.pathArray[0]==='departments' && node.pathArray[1]==='admin' && node.level===3){
		return 'department '+node.key+': '+node.value;
	}
});
console.log(res);
>> 
[ 'department name: Administrative',
  'department manager: john',
  'department employees: john,lee',
  'contact: employees.0.contact.0',
  'contact: employees.0.contact.1',
  'contact: employees.0.contact.2.address' ]
```
When `has(propertyName)` receives a string it calls `node.value[propertyName]`. If RegExp is passed, all properties of `node.value` are iterated and tested against it.

&#35;4. node.key, node.parent and node.get()
```js
var res = new Jef(sample1).filter(function(node){
	if(node.key==='email' && node.value==='a@b.c'){
		var res = [];
		res.push('Email: key - '+node.key+', value: '+node.value+', path: '+node.path);

		if(node.parent){ // Test parent exists
			var emailContainer = node.parent;
			res.push('Email parent: key - '+emailContainer.key+', type: '+emailContainer.getType()+', path: '+emailContainer.path);
		}

		if(node.parent && node.parent.parent){
			var contact = node.parent.parent;
			res.push('Contact: key - '+contact.key+', type: '+contact.getType()+', path: '+contact.path);

			var city = contact.get('2.address.city');
			if(city){ // Test relative path exists. node.get() returns 'undefined' otherwise.
				res.push('City: key - '+city.key+', type: '+city.value+', path: '+city.path);
			}
		}

		return res;
	}
});
console.log(res);
>>
[ [ 'Email: key - email, value: a@b.c, path: employees.0.contact.1.email',
    'Email parent: key - 1, type: object, path: employees.0.contact.1',
    'Contact: key - contact, type: array, path: employees.0.contact',
    'City: key - city, type: NY, path: employees.0.contact.2.address.city' ] ]
```

&#35;5. Array handling
```js
var res = new Jef(sample1).filter(function(node){
	if(node.parent && node.parent.key==='employees'){
		if(node.getType()==='object'){
			return 'key: '+node.key+', username: '+node.value.username+', path: '+node.path;
		} else{
			return 'key: '+node.key+', username: '+node.value+', path: '+node.path;
		}
	}
});
console.log(res);
>>
[ 'key: 0, username: john, path: departments.admin.employees.0',
  'key: 1, username: lee, path: departments.admin.employees.1',
  'key: 0, username: scott, path: departments.it.employees.0',
  'key: 1, username: john, path: departments.it.employees.1',
  'key: 2, username: lewis, path: departments.it.employees.2',
  'key: 0, username: adams, path: departments.finance.employees.0',
  'key: 1, username: scott, path: departments.finance.employees.1',
  'key: 2, username: lee, path: departments.finance.employees.2',
  'key: 0, username: john, path: employees.0',
  'key: 1, username: adams, path: employees.1',
  'key: 2, username: lee, path: employees.2',
  'key: 3, username: scott, path: employees.3',
  'key: 4, username: null, path: employees.4',
  'key: 5, username: undefined, path: employees.5' ]
```
&#35;6. Circular references
```js
var data = {
	x: {
		y: null  
	},
	z: null,
	t: null
};
data.z = data.x;
data.x.y = data.z;
data.t = data.z;
var res = new Jef(data).filter(function(node) {
	if(node.isRoot){
		return 'root';
	} else if (node.isCircular) {
		return 'circular key: '+node.key + ', path: '+node.path;
	} else{
		return 'key: '+node.key + ', path: '+node.path;
	}
});
console.log(res);
>>
[ 'root',
  'key: x, path: x',
  'circular key: y, path: x.y',
  'key: z, path: z',
  'circular key: y, path: z.y',
  'key: t, path: t',
  'circular key: y, path: t.y' ]

```

### Validate
&#35;1. node.validate()
```js
var res = new Jef(sample1).validate(function(node) {
	if (node.parent && node.parent.key==='departments' && !node.has('manager')) {
		// current department is missing the mandatory 'manager' property
		return false;
	}
});
console.log(res);
>> false
```
&#35;2. Validation info
```js
var info = [];
var res = new Jef(sample1).validate(function(node) {
var valid = true;
if (node.parent && node.parent.key==='departments' ) {
	// Inside department
	if(!node.has('manager')){
		valid = false;
		info.push('Error: '+node.key+' department is missing mandatory manager property');
	}
	if(!node.has('employees')){
		valid = false;
		info.push('Error: '+node.key+' department is missing mandatory employee list');
	} else if(node.get('employees').getType()!=='array'){
		valid = false;
		info.push('Error: '+node.key+' department has wrong employee list type "'+node.get('employees').getType()+'"');
	} else if(node.value.employees.length===0){
		info.push('Warning: '+node.key+' department has no employees');
	}
}
if (node.parent && node.parent.key==='employees' && node.getType()==='object') {
	// Inside employee
	if(!node.has('username') || node.get('username').getType()!=='string'){
		valid = false;
		info.push('Error: Employee '+node.path+' does not have username');
	} else if(!node.has('gender')){
		info.push('Warning: Employee '+node.value.username+' does not have gender');
	}
}

return valid;
});
console.log(res.toString());
console.log(info);
>>
false
[ 'Error: marketing department is missing mandatory manager property',
  'Warning: marketing department has no employees',
  'Error: hr department is missing mandatory manager property',
  'Error: hr department is missing mandatory employee list',
  'Error: supply department is missing mandatory manager property',
  'Error: supply department has wrong employee list type "string"',
  'Warning: Employee scott does not have gender',
  'Error: Employee employees.4 does not have username',
  'Error: Employee employees.5 does not have username' ]
```
<a name="API"></a>
## API

`JsonEasyFilter(jsonData)` - traverses jsonData and builds a hash map of ``JsonNode`` objects. Returns the root node.

**JsonNode**
Wrapps a real Js node inside the tree that is traversed.
* `node.key` - the key of the currently traversed object.
* `node.value` - the value of the currently traversed object.
* `node.isRoot` - true if current node is the root of the object tree.
* `node.path` - string representation of `node.pathArray`.
* `node.pathArray` - string array containing the path to current node.
* `node.level` - level of the current node. Root node has level 0.
* `node.has(propertyName)` - returns true if `node.value` has that property. If a regular expression is passed, all `node.value` property names are iterated and matched against pattern. 
* `node.get(relativePath)` - returns the `JsonNode` relative to current node or 'undefined' if path cannot be found.
* `node.getType()` - returns the type of `node.value` as one of 'string', 'array', 'object', 'function', 'undefined', 'number', 'null'.
* `node.filter(callback)` - traverses node's children and triggers `callback(childNode)`. The result of callback call is added to an array which is later returned by  filter method.
* `node.validate(callback)` - traverses node's children and triggers `callback(childNode)`. If any of the calls to callback method returns `false`, validate method will also return `false`.

<a name="Links"></a>
## Links
* XPath like query for json - <a href="https://www.npmjs.org/package/JSONPath" target="_blank">JsonPath</a>, <a href="https://www.npmjs.org/package/spahql" target="_blank">SpahQL</a>
*  Filter, map, reduce - <a href="https://www.npmjs.org/package/traverse" target="_blank">traverse</a>
* Json validator - <a href="https://www.npmjs.org/package/json-filter" target="_blank">json-filter</a>
