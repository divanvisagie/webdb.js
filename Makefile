all:
	browserify main.js > bundle.js


clean:
	rm -rf bundle.js