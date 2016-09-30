lib_src_dir=src
lib_build_dir=build/js

test_src_dir=test
test_build_dir=build/test

ts_compiler_options+=--outDir $(lib_build_dir)
ts_compiler_options+=--target es5
ts_compiler_options+=--lib es7,dom
ts_compiler_options+=--declaration
ts_compiler_options+=--experimentalDecorators
ts_compiler_options+=--forceConsistentCasingInFileNames
ts_compiler_options+=--noFallthroughCasesInSwitch
ts_compiler_options+=--noImplicitAny
ts_compiler_options+=--noImplicitThis
ts_compiler_options+=--noImplicitUseStrict
ts_compiler_options+=--noUnusedLocals
# ts_compiler_options+=--noUnusedParameters
ts_compiler_options+=--strictNullChecks
ts_compiler_options+=--noImplicitReturns
ts_compiler_options+=--noEmitOnError
ts_compiler_options+=--module umd
ts_compiler_options+=--newLine LF
ts_compiler_options+=--pretty

ts_compiler_bin=./node_modules/typescript/bin/tsc


lib_sources=$(shell find $(lib_src_dir) -type f -wholename "*.ts")
lib_outputs=$(lib_sources:$(lib_src_dir)/%.ts=$(lib_build_dir)/%.js)

test_sources=$(shell find $(test_src_dir) -type f -wholename "*.ts")
test_outputs=$(test_sources:$(test_src_dir)/%.ts=$(test_build_dir)/%.js)
test_sources+=typings/index.d.ts


typings_bin=node_modules/typings/dist/bin.js


define tsc_compile
$(ts_compiler_bin) $(ts_compiler_options)
endef


$(lib_build_dir)/%.js: $(lib_src_dir)/%.ts
	$(tsc_compile)


$(test_build_dir)/%.js: $(test_src_dir)/%.ts
	$(tsc_compile)


.PHONY: all
all:
	$(tsc_compile) $(lib_sources)


.PHONY: tests
tests:
	$(tsc_compile) $(test_sources)


.PHONY: clean
clean:
	rm -r $(lib_build_dir)


.PHONY: typings-install
typings-install:
	$(typings_bin) install
