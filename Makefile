lib: es6-lib node_modules node_modules/node-srs
	mkdir -p lib
	node_modules/.bin/babel es6-lib --out-dir lib

test: lib
	mkdir -p test
	node_modules/.bin/babel es6-test --out-dir test
	rm -f test/fixtures
	ln -sf $(CURDIR)/es6-test/fixtures  test/fixtures
	GEO_IMPORT_ENV=test ./node_modules/.bin/mocha test/unit test/smoke && jshint es6-lib

appease_jenkins: lib
	tar -zcvf lib.tar lib/

translations: lib
	mkdir -p translations
	node lib/tasks/translations.js > translations/en.yml

node_modules:
	npm set progress=false # this makes npm twice as fast ;_;
	npm i

node_modules/node-srs:
	mkdir -p node_modules/node-srs
	git clone https://github.com/rozap/node-srs node_modules/node-srs
	cd node_modules/node-srs && CC=gcc CXX=g++ npm install && cd ../..
	cd ../..

clean:
	rm -rf lib
	rm -rf test
	rm -f lib.tar
	rm -rf translations

.PHONY: clean test translations
