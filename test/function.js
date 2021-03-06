var assert = require('assert'),
    Blast;

describe('Function', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.create(name, fnc)', function() {
		it('should return a new named function', function() {

			var fnc = Function.create('ReturnOne', function() {
				return 1;
			});

			assert.equal(fnc.name, 'ReturnOne');
			assert.equal(fnc(), 1);
		});

		it('should have a reference to the newly wrapped function', function() {

			var fnc = Function.create('ReturnWrapperName', function med() {
				return med.wrapper.name;
			});

			assert.equal(fnc(), 'ReturnWrapperName');
		});

		it('should have the same amount of arguments', function() {

			var fnc = Function.create('ReturnWrapperName', function test(a, b) {

			});

			assert.equal(fnc.length, 2);
			assert.equal(fnc.name, 'ReturnWrapperName');
		});

		it('should accept an array as argument names', function() {

			var fnc = Function.create('ReturnWrapperName', ['a', 'b', 'c'], function test() {});

			assert.equal(fnc.length, 3);
			assert.equal(fnc.name, 'ReturnWrapperName');
		});

		it('should accept a string as argument names', function() {

			var fnc = Function.create('ReturnWrapperName', 'a, b, c, d', function test() {});

			assert.equal(fnc.length, 4);
			assert.equal(fnc.name, 'ReturnWrapperName');
		});
	});

	describe('.tokenize(source, addType, throwError)', function() {
		it('should tokenize a function', function() {

			var tokens,
			    fnc;

			fnc = function fname(a, b) {
				return a+b;
			};

			tokens = Function.tokenize(fnc, true);

			assert.equal(tokens[0].type, 'keyword');
			assert.equal(tokens[0].value, 'function');
			assert.equal(tokens[2].type, 'name');
			assert.equal(tokens[2].value, 'fname');
		});

		it('should recognize invalid tokens', function() {

			var tokens,
			    source = 'function €(){vra é #}';

			tokens = Function.tokenize(source, true);

			assert.equal(tokens[0].type, 'keyword');
			assert.equal(tokens[2].type, 'invalid');
			assert.equal(tokens[10].type, 'invalid');
		});

		it('should only return the values when addType is false or not set', function() {

			var tokens,
			    source = 'function() {return 1}';

			tokens = Function.tokenize(source);

			assert.equal(tokens[0], 'function');
			assert.equal(tokens[2], ')');
			assert.equal(tokens[3], ' ');
		});

		it('is also available on the function', function() {

			var tokens;

			function myFnc() {};

			tokens = myFnc.tokenize();

			assert.equal(tokens[0], 'function');
			assert.equal(tokens[6], '{');
		});
	});

	describe('.getArgumentNames(fnc)', function() {

		it('should return the argument names of a function', function() {

			var names;

			names = Function.getArgumentNames(function test(alpha, beta) {
				return null;
			});

			assert.equal(names[0], 'alpha');
			assert.equal(names[1], 'beta');
			assert.equal(names.length, 2);
		});

		it('should return empty array when no name is set', function() {

			var names = Function.getArgumentNames(function test() {});

			assert.equal(names.length, 0);
		});

		it('should return empty array when there is only a space', function() {

			var names = Function.getArgumentNames(function test( ) {});

			assert.equal(names.length, 0);
		});

		it('should also accept a string', function() {

			var names = Function.getArgumentNames('function test(alpha, beta) {}');

			assert.equal(names[0], 'alpha');
			assert.equal(names[1], 'beta');
			assert.equal(names.length, 2);
		});
	});

	describe('.isNameAllowed(name)', function() {
		it('should return true for allowed names', function() {
			assert.equal(Function.isNameAllowed('zever'), true);
			assert.equal(Function.isNameAllowed('jelle'), true);
		});

		it('should return false for reserved names', function() {
			assert.equal(Function.isNameAllowed('delete'), false);
			assert.equal(Function.isNameAllowed('continue'), false);
			assert.equal(Function.isNameAllowed('new'), false);
			assert.equal(Function.isNameAllowed('typeof'), false);
		});

		it('should return false for names starting with numbers', function() {
			assert.equal(Function.isNameAllowed('3delete'), false);
			assert.equal(Function.isNameAllowed('3continue'), false);
			assert.equal(Function.isNameAllowed('3new'), false);
			assert.equal(Function.isNameAllowed('3typeof'), false);
		});
	});

	describe('#getBodySource()', function() {
		it('should return the source code of the body', function() {

			var body;

			function myFnc() {return 1 + 1;};

			body = myFnc.getBodySource();

			assert.equal(body, 'return 1 + 1;');
		});
	});

	describe('#methodize()', function() {
		it('should create a new function that calls the given function with current "this" context as the first argument', function() {

			var fnc = function(obj){return obj.zever;},
			    test = {zever: 'TEST'},
			    methodized = fnc.methodize();

			test.fnc = methodized;

			assert.equal(fnc({}), undefined);
			assert.equal(test.fnc(), 'TEST');
		});

		it('should handle arguments as expected', function() {

			var methodized,
			    test;

			function myFnc(obj, addition) {
				return obj.number + addition;
			}

			methodized = myFnc.methodize();

			test = {
				number : 1,
				myFnc  : methodized
			};

			assert.equal(String(myFnc({}, 5)), 'NaN');
			assert.equal(test.myFnc(4), 5);
		});

		it('should cache earlier methodized functions', function() {

			var fnc = function(){},
			    m1,
			    m2;

			m1 = fnc.methodize();
			m2 = fnc.methodize();

			assert.equal(m1, m2);
		});

		it('allows setting the wrapper name', function() {

			var methodized;

			function myFnc(){}
			function m_fnc(){}
			function toTestDelete(){}

			assert.equal(myFnc.methodize('bla').name, 'bla');
			assert.equal(m_fnc.methodize().name, '_m_fnc');
			assert.equal(toTestDelete.methodize('delete').name, '_delete');
		});

		it('should set the original function as the unmethodized one', function() {

			var methodized;

			function myFnc(){}

			methodized = myFnc.methodize();

			assert.equal(methodized.unmethodize(), myFnc);
		});
	});

	describe('#unmethodize()', function() {
		it('should create a new function that calls the given function with the first argument as the context', function() {

			var fnc = function(){return this.zever;},
			    methodized = fnc.unmethodize();

			assert.equal(fnc(), undefined);
			assert.equal(methodized({zever: 'TEST'}), 'TEST');
		});

		it('should be able to set the wrapper name', function() {

			function myFnc(){};
			function bla_fnc(){};
			function u_fnc(){};
			function toTestDelete(){};

			assert.equal(myFnc.unmethodize().name, 'myFnc');
			assert.equal(bla_fnc.unmethodize('bla').name, 'bla');
			assert.equal(u_fnc.unmethodize('u_fnc').name, '_u_fnc');
			assert.equal(toTestDelete.unmethodize('delete').name, '_delete');
		});
	});

	describe('#listenTo(event, context)', function() {

		it('should subscribe to the event on the given context', function() {

			var emitter = new Informer(),
			    false_result,
			    result,
			    output;

			function listener(input) {
				output = input;
			}

			result = listener.listenTo('test', emitter);
			false_result = listener.listenTo('test');

			emitter.emit('test', 'alpha');

			assert.equal(output, 'alpha');
			assert.equal(result, true);
			assert.equal(false_result, false);

			emitter.emit('test', 'zever');
			assert.equal(output, 'zever');
		});

		it('should subscribe using addEventListener', function() {

			var emitter = new Informer(),
			    false_result,
			    result,
			    output;

			function listener(input) {
				output = input;
			}

			emitter.addEventListener = emitter.addListener;
			emitter.addListener = null;

			result = listener.listenTo('test', emitter);
			false_result = listener.listenTo('test');

			emitter.emit('test', 'alpha');

			assert.equal(output, 'alpha');
			assert.equal(result, true);
			assert.equal(false_result, false);
		});

		it('should subscribe using listen', function() {

			var emitter = new Informer(),
			    false_result,
			    result,
			    output;

			function listener(input) {
				output = input;
			}

			emitter.listen = emitter.addListener;
			emitter.addListener = null;

			result = listener.listenTo('test', emitter);
			false_result = listener.listenTo('test');

			emitter.emit('test', 'alpha');

			assert.equal(output, 'alpha');
			assert.equal(result, true);
			assert.equal(false_result, false);
		});

		it('should subscribe using on', function() {

			var emitter = new Informer(),
			    false_result,
			    result,
			    output;

			function listener(input) {
				output = input;
			}

			emitter.on = emitter.addListener;
			emitter.addListener = null;

			result = listener.listenTo('test', emitter);
			false_result = listener.listenTo('test');

			emitter.emit('test', 'alpha');

			assert.equal(output, 'alpha');
			assert.equal(result, true);
			assert.equal(false_result, false);
		});

		it('should return false if the listener is not found', function() {

			var emitter = new Informer(),
			    false_result,
			    result,
			    output;

			function listener(input) {
				output = input;
			}

			emitter.addListener = null;
			emitter.on = null;

			result = listener.listenTo('test', emitter);

			assert.equal(result, false);
		});
	});

	describe('#unListen(event, context)', function() {

		it('should subscribe to the event on the given context', function() {

			var emitter = new Informer(),
			    false_result,
			    result,
			    output;

			function listener(input) {
				output = input;
			}

			result = listener.listenTo('test', emitter);
			false_result = listener.listenTo('test');

			emitter.emit('test', 'alpha');

			assert.equal(output, 'alpha');
			assert.equal(result, true);
			assert.equal(false_result, false);

			listener.unListen('test', emitter);
			emitter.emit('test', 'zever');

			// Output should still be alpha
			assert.equal(output, 'alpha');
		});
	});

	describe('#curry()', function() {
		it('should create a function that already contains pre-filled-in arguments', function() {

			var adder,
			    addTen;

			adder = function adder(a, b) {
				return a+b;
			}

			addTen = adder.curry(10);

			assert.equal(addTen(5), adder(10, 5));
			assert.equal(addTen.name, adder.name);
		});
	});

	describe('.tryCatch(fnc, args, context)', function() {

		it('should return the original value when no errors occur', function() {

			var result;

			result = Function.tryCatch(function() {
				return 'alpha';
			});

			assert.equal(result, 'alpha');
		});

		it('should catch errors and return them', function() {

			var result;

			result = Function.tryCatch(function() {
				return _does_not_exist + 1;
			});

			assert.equal(result.constructor.name, 'ReferenceError');
		});

		it('should apply the given args', function() {

			var result;

			result = Function.tryCatch(function(a, b) {
				return a+b;
			}, [1, 2]);

			assert.equal(result, 3);
		});

		it('should apply the given context', function() {

			var result;

			result = Function.tryCatch(function() {
				return this.a + this.b;
			}, null, {a: 1, b: 2});

			assert.equal(result, 3);
		});

	});
});