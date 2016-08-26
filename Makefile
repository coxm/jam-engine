ts_src_dir=src
ts_build_dir=build/js

ts_compiler_options+=--outDir $(ts_build_dir)
ts_compiler_options+=--target es5
ts_compiler_options+=--lib es7
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
ts_sources=$(shell find $(ts_src_dir) -type f -wholename "*.ts")
ts_outputs=$(ts_sources:$(ts_src_dir)/%.ts=$(ts_build_dir)/%.js)


typings_bin=node_modules/typings/dist/bin.js


define tsc_compile
$(ts_compiler_bin) $(ts_compiler_options)
endef


$(ts_build_dir)/%.js: $(ts_src_dir)/%.ts
	$(tsc_compile)


.PHONY: all
all:
	$(tsc_compile) $(ts_sources)


.PHONY: clean
clean:
	rm -r $(ts_build_dir)


.PHONY: typings-install
typings-install:
	$(typings_bin) install
