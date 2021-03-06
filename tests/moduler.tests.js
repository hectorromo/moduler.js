﻿/// <reference path="moduler.js" />
/// <reference path="qunit.js" />
var $fixture = $('#qunit-fixture');

QUnit.testStart(function (test) {
    moduler('app', {
        init: function () { }
    });
});

QUnit.testDone(function (test) {
    for (var module in mo.modules) {
        if (module != 'register') {
            delete mo.modules[module];
        }
    }
});


module("Register Module");

test("register an empty module", function () {
    moduler('test-module', {});

    ok(mo.modules['test-module'] != null, "Module should be registered");
});

//test("prevent adding module named 'register'", function () {
//    throws(function () {
//        moduler('register', {});
//    }, "throws when adding module named 'register'")
//});

test("register a module that has an 'init' method", function () {
    var initFired = false;

    moduler('test-module', {
        init: function () {
            initFired = true;
        }
    });

    mo.utils.addModuleToElement('#div1', 'test-module');

    notEqual(mo.utils.getModule('#div1', 'test-module'), null, 'Module is initalized')
    equal(initFired, true, "Init method has fired")
});

test("adding a second module to element", function () {
    var initFired = false;

    moduler('test-second-module', {
        init: function () {
            initFired = true;
        }
    });

    mo.utils.addModuleToElement('#app', 'test-second-module');

    notEqual(mo.utils.getModule('#app', 'test-second-module'), false, 'Module is initalized')
    equal(initFired, true, "Init method has fired")
});

test("adding a module two times to element should not run it twice", function () {
    expect(1);

    moduler('test-module', {
        init: function () {
            ok(true, 'Init fired');
        }
    });

    mo.utils.addModuleToElement('#div1', 'test-module');
    mo.utils.addModuleToElement('#div1', 'test-module');
});


module("Settings");

test("invalid formated settings attribute should throw error", function () {
    moduler('test-module', {
        init: function (module) {
            notEqual(module.settings, null);
        }
    });

    mo.utils.addModuleToElement('#div1', 'test-module', false);

    // properties without quotes are not valid in JSON
    $('#div1').attr('data-test-module', '{ hello: 1 }');

    throws(function () {
        mo.loadModules();
    }, "Throws error when invalid json");
});

test("settings is an empty object if no settings entered and no defaults", function () {
    moduler('test-module', {
        init: function (module) {
            notEqual(module.settings, null);
        }
    });

    mo.utils.addModuleToElement('#div1', 'test-module');
});

test("settings are unique to each element", function () {
    moduler('test-module', {
        init: function (module) {
            if (module.element.id == 'div1')
                equal(module.settings.name, 'Jane Doe');
            else
                equal(module.settings.name, 'Plain Joe');
        }
    });

    mo.utils.addModuleToElement('#div1', 'test-module', { name: 'Jane Doe' }, false);
    mo.utils.addModuleToElement('#div2', 'test-module', { name: 'Plain Joe' });
});

test("settings extend from default values", function () {
    moduler('test-module', {
        defaults: {
            name: 'Joe Doe',
            age: 30
        },
        init: function (module) {
            equal(module.settings.name, 'Jane Doe');
            equal(module.settings.age, 30);
        }
    });

    mo.utils.addModuleToElement('#div1', 'test-module', { name: 'Jane Doe' });
});

test("get settings for element and module", function () {
    moduler('test-module', {
        defaults: {
            name: 'Joe Doe',
            age: 30
        },
        init: function (module) { }
    });

    mo.utils.addModuleToElement('#div1', 'test-module', { name: 'Jane Doe' });

    var settings = mo.utils.getSettings('#div1', 'test-module');
    equal(settings.name, 'Jane Doe', 'Name is equal to Jane Doe');
    equal(settings.age, 30, 'Age is equal to 30');
});


module("Listen Events");

asyncTest("module with listen events", function () {
    moduler('test-module', {
        defaults: { name: 'Jane Doe' },
        init: function () { },

        listen: {
            helloWorld: mo.event(function (module, e, extraParameter) {
                ok(true, 'recived helloWorld event');
                equal(module.name, 'test-module', 'module name is populated');
                equal(module.element.id, 'div1', 'element object is populated');
                equal(module.$element.length, 1, '$element object is populated');
                equal(module.settings.name, 'Jane Doe', 'settings object is populated');
                equal(extraParameter, "hello", 'extra parameters is populated')
                equal(this, module.element, 'this and element are the same')
                start();
            })
        }
    });
    mo.utils.addModuleToElement('#div1', 'test-module');

    $('#div1').trigger('helloWorld', ['hello']);
});

asyncTest("calling event functions directly", function () {
    var testModule = moduler('test-module', {
        defaults: { name: 'Jane Doe' },
        init: function () { },

        listen: {
            helloWorld: mo.event(function (module, e, extraParameter) {
                ok(true, 'recived helloWorld event');
                equal(module.name, 'test-module', 'module name is populated');
                equal(module.element.id, 'div1', 'element object is populated');
                equal(module.$element.length, 1, '$element object is populated');
                equal(module.settings.name, 'Jane Doe', 'settings object is populated');
                equal(extraParameter, "hello", 'extra parameters is populated')
                equal(this, module.element, 'this and element are the same')
                start();
            })
        }
    });
    mo.utils.addModuleToElement('#div1', 'test-module');

    testModule.listen.helloWorld(mo.utils.getModule('#div1', 'test-module'), null, 'hello');
});


module("Change Tracking");

asyncTest("when adding elements to the DOM they should register automatically", function () {
    expect(2);

    moduler('test-module', {
        init: function () {
            ok(true, 'first init method was called');
        }
    });

    moduler('another-module', {
        init: function () {
            ok(true, 'second init method was called');
            start();
        }
    });

    $fixture.append('<div data-module="test-module"></div>')
    $fixture.find('#div2').html('<div data-module="another-module"></div>')
    $fixture.find('#div1').empty().remove();
});


module('Settings Syntax');

test('can parse boolean settings value', function () {
    var settings = mo.utils.parseSettings('parsing: true')

    equal(settings.parsing, true);
});

test('can parse string settings value in double quotes', function () {
    var settings = mo.utils.parseSettings('name: "Joe"')

    equal(settings.name, 'Joe');
});

test('can parse string settings value in single quotes', function () {
    var settings = mo.utils.parseSettings("name: 'Joe'")

    equal(settings.name, 'Joe');
});

test('can parse numeric settings value', function () {
    var settings = mo.utils.parseSettings("years: 10")

    equal(settings.years, 10);
});

test('can parse three properties', function () {
    var settings = mo.utils.parseSettings("years: 10, name: 'Joe', male: true")

    equal(settings.years, 10);
    equal(settings.name, 'Joe');
    equal(settings.male, true);
});

test('can parse complex property', function () {
    var settings = mo.utils.parseSettings("person: { name: 'Joe' }")

    equal(settings.person.name, 'Joe');
});

test('can parse complex property, with other properties', function () {
    var settings = mo.utils.parseSettings("one: 1, person: { name: 'Joe' }, two: 2")

    equal(settings.person.name, 'Joe');
    equal(settings.one, 1);
    equal(settings.two, 2);
});

test('can parse deep complex property', function () {
    var settings = mo.utils.parseSettings("person: { name: 'Joe', nested: { one: 1, two: 2 }}");

    equal(settings.person.name, 'Joe');
    equal(settings.person.nested.one, 1);
    equal(settings.person.nested.two, 2);
});

test('can parse array property', function () {
    var settings = mo.utils.parseSettings("ages: [2, 5, 8]");

    equal($.isArray(settings.ages), true);
    equal(settings.ages.length, 3);
    equal(settings.ages[2], 8);
});

test('can parse object array property', function () {
    var settings = mo.utils.parseSettings("people:[{ name: 'Sarah' }, {name: 'Peter'}]");

    equal($.isArray(settings.people), true);
    equal(settings.people.length, 2);
    equal(settings.people[1].name, 'Peter');
});

test('can parse property with special chars', function () {
    var settings = mo.utils.parseSettings("$property-with_characters1: true");

    equal(settings['$property-with_characters1'], true);
});

module('Module Late Init');

asyncTest('module with custom init event should not be init on load', function () {
    expect(1);

    var tim = setTimeout( function  () {
        ok(true, 'module was not initalized on load');
        start();
    }, 100);

    moduler('test-module', {
        defaults: { name: 'Jane Doe' },

        init: function () {
            clearTimeout(tim);

            ok(false, 'module should not be initalized on load');
            start();
        }
    });
    mo.utils.addModuleToElement('#div1', 'test-module:late-event');
});

asyncTest('can delay init of module', function () {
    expect(1);

    var tim = setTimeout( function  () {
        ok(false, 'module was not initalized by "late-event"');
        start();
    }, 500);

    moduler('test-module', {
        defaults: { name: 'Jane Doe' },

        init: function () {
            clearTimeout(tim);

            ok(true, 'module was initalized by "late-event"');
            start();
        }
    });
    mo.utils.addModuleToElement('#div1', 'test-module:late-event');
    
    $('#div1').trigger('late-event'); 
});


