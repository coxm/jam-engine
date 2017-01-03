ts_compiler_bin=./node_modules/typescript/bin/tsc
karma_bin=./node_modules/karma/bin/karma


build_dir=build

lib_src_dir=src
lib_build_dir=$(build_dir)/js

test_src_dir=test
test_build_dir=$(build_dir)/test


lib_sources=$(shell find $(lib_src_dir) -type f -wholename "*.ts")
lib_outputs=$(lib_sources:$(lib_src_dir)/%.ts=$(lib_build_dir)/%.js)

test_sources=$(shell find $(test_src_dir) -type f -wholename "*.ts")
test_outputs=$(test_sources:$(test_src_dir)/%.ts=$(test_build_dir)/%.js)
test_sources+=typings/index.d.ts


typings_bin=node_modules/typings/dist/bin.js


define karma_start
$(karma_bin) start config/karma.conf.js
endef


.PHONY: all
all: js tests
	


.PHONY: js
js:
	$(ts_compiler_bin) -p config/lib.tsconfig.json


.PHONY: tests
tests:
	$(ts_compiler_bin) -p config/tests.tsconfig.json


.PHONY: test
test:
	$(karma_start) --single-run=true


.PHONY: test-server
test-server:
	$(karma_start) --single-run=false


.PHONY: coverage
coverage: $(build_dir)/coverage/html/index.html
	


$(build_dir)/coverage/html/index.html:
	mkdir -p "$(build_dir)/coverage"
	$(karma_start) --single-run=true --reporters=coverage


.PHONY: clean
clean:
	rm -r $(build_dir)


.PHONY: typings-install
typings-install:
	$(typings_bin) install
