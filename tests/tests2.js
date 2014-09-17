"use strict";

var fs = require('fs');
var Jef = require('json-easy-filter');
var sample1 = require('./sampleData1.js');

var Tests2 = function () {
    this.test1 = function (printResult) {
        var res = new Jef(sample1).get('departments.admin').filter(function (node) {
            if (node.value.manager === 'john') {
                return node.value.manager;
            }
        });
        if (printResult) {
            console.log(res);
        }
        var testResult = res.toString() === [
            'john'
        ].toString();
        return testResult;
    };
    this.test2 = function (printResult) {
        var res = new Jef(sample1).get('employees').parent.isRoot;
        if (printResult) {
            console.log(res);
        }
        var testResult = res.toString() === true.toString();
        return testResult;
    };
    this.test3 = function (printResult) {
        var res = new Jef(sample1).filter(function (node) {
            if (node.isRoot) {
                return 'Root node - level=' + node.level + ', path: ' + node.path + ', pathLength=' + node.pathArray.length;
            }
            if (node.key === 'departments') {
                return 'Departments node - level=' + node.level + ', path: ' + node.path + ', pathLength=' + node.pathArray.length;
            }
            if (node.has('username') && node.value.username === 'john') {
                var email = node.get('contact.1.email');
                return 'Email node - level=' + email.level + ', path: ' + email.path + ', pathLength=' + email.pathArray.length;
            }
        });
        if (printResult) {
            console.log(res);
        }
        var testResult = res.toString() === [
                'Root node - level=0, path: , pathLength=0',
                'Departments node - level=1, path: departments, pathLength=1',
                'Email node - level=5, path: employees.0.contact.1.email, pathLength=5'
        ].toString();
        return testResult;
    };
    this.test4 = function (printResult) {
        var res = new Jef(sample1).filter(function (node) {
            if (node.isLeaf && node.level > 3) {
                return node.path;
            }
        });
        if (printResult) {
            console.log(res);
        }
        var testResult = res.toString() === [
                'departments.admin.employees.0',
                'departments.admin.employees.1',
                'departments.it.employees.0',
                'departments.it.employees.1',
                'departments.it.employees.2',
                'departments.finance.employees.0',
                'departments.finance.employees.1',
                'departments.finance.employees.2',
                'employees.0.contact.0.phone',
                'employees.0.contact.1.email',
                'employees.0.contact.2.type',
                'employees.0.contact.2.address.city',
                'employees.0.contact.2.address.country'
        ].toString();
        return testResult;
    };

    // isLeaf
    this.test5 = function () {
        var res = new Jef({
            x : {
                y : 'z'
            },
            A : {},
            b : [
                    'b', {}, undefined, null, {
                        b1 : 'ba',
                        b2 : {
                            b11 : {},
                            b12 : null
                        }
                    }
            ],
            c : undefined,
            d : null
        }).filter(function (node) {
            if (node.isLeaf) {
                return node.path;
            }
        });
        if (false) {
            console.log(res);
        }
        var testResult = res.toString() === [
                'x.y', 'b.0', 'b.2', 'b.3', 'b.4.b1', 'b.4.b2.b12', 'c', 'd'
        ].toString();
        return testResult;
    };

    // http://stackoverflow.com/questions/25678022/how-to-use-jquery-grep-to-filter-extremely-nested-json
    this.test6 = function () {
        var data = require('./tests2-test6-input');
        var start = new Date('2015-01-03');
        var end = new Date('2015-01-07');
        var success = new Jef(data).remove(function (node) {
            if (node.has('requests')) {
                var requests = node.value.requests;
                for (var i = 0; i < requests.length; i++) {
                    var request = requests[i];
                    var pick = new Date(request.pickupdate);
                    var ret = new Date(request.returndate);
                    if (!((pick < start && ret < start) || (pick > end && ret > end))) {
                        // pickupdate-returndate overlaps with start-end
                        return node;
                    }
                }
            }
        });

        if (false) {
            console.log(JSON.stringify(data, null, 4));
            console.log(success);
        }
        var expected = JSON.parse(fs.readFileSync('tests2-test6-expected.json', 'utf8'));
        var testResult = JSON.stringify(data, null, 4) === JSON.stringify(expected, null, 4) && success;
        return testResult;
    };

    /**
     * Circular references
     */
    this.test7 = function () {
        var data = {
            x : {
                a : {
                    b : 'b'
                },
                y : undefined,
                c : 'c',
                arr : [
                        'd', undefined, undefined
                ]
            },
            z : undefined,
            t : undefined
        };
        data.z = data.x;
        data.x.y = data.z;
        data.t = data.z;
        data.x.arr[1] = data.t;
        var res = new Jef(data).filter(function (node) {
            if (node.isRoot) {
                return 'root';
            } else if (node.isCircular) {
                return 'circular key: ' + node.key + ', path: ' + node.path;
            } else {
                return 'key: ' + node.key + ', path: ' + node.path;
            }
        });
        if (false) {
            console.log(res);
        }
        var testResult = res.toString() === [
                'root',
                'key: x, path: x',
                'key: a, path: x.a',
                'key: b, path: x.a.b',
                'circular key: y, path: x.y',
                'key: c, path: x.c',
                'key: arr, path: x.arr',
                'key: 0, path: x.arr.0',
                'circular key: 1, path: x.arr.1',
                'key: 2, path: x.arr.2',
                'circular key: z, path: z',
                'circular key: t, path: t'
        ].toString();
        return testResult;
    };
    // isEmpty() and count
    this.test8 = function () {
        var res = new Jef({
            x : {
                y : 'z',
                t : {}
            },
            a : [],
            b : [
                    'p1', {}, {
                        p4 : 'p4'
                    }
            ]
        }).filter(function (node) {
            return node.path + ' ' + node.count + ' ' + node.isEmpty();
        });
        if (false) {
            console.log(res);
        }
        var testResult = res.toString() === [
                ' 3 false', 'x 2 false', 'x.y 0 true', 'x.t 0 true', 'a 0 true', 'b 3 false', 'b.0 0 true', 'b.1 0 true', 'b.2 1 false', 'b.2.p4 0 true'
        ].toString();
        return testResult;
    };

};

module.exports = function () {
    return new Tests2();
};
