ts_compiler_bin=./node_modules/typescript/bin/tsc


build_dir=build

lib_src_dir=src
lib_build_dir=$(build_dir)/js

test_src_dir=test
test_build_dir=$(build_dir)/test


lib_sources=$(shell find $(lib_src_dir) -type f -path "*.ts")
lib_outputs=$(lib_sources:$(lib_src_dir)/%.ts=$(lib_build_dir)/%.js)

test_sources=$(shell find $(test_src_dir) -type f -path "*.ts")
test_outputs=$(test_sources:$(test_src_dir)/%.ts=$(test_build_dir)/%.js)
test_sources+=typings/index.d.ts

assets_dir=assets
svg_assets=$(shell find $(assets_dir) -type f -path "*.svg")
png_assets=$(svg_assets:%.svg=%.png)


typings_bin=node_modules/typings/dist/bin.js


.PHONY: all
all: js tests
	


.PHONY: js
js:
	$(ts_compiler_bin) -p tsconfig.json


.PHONY: tests
tests:
	$(ts_compiler_bin) -p config/tests.tsconfig.json


.PHONY: test
test:
	npm run test


.PHONY: clean
clean:
	rm -r $(build_dir)


.PHONY: assets
assets: $(png_assets)
	


$(assets_dir)/%.png: $(assets_dir)/%.svg
	inkscape -z -e "$@" "$+"
