.PHONY: install dev serve start stop restart build

DEV_PID_FILE := .dev.pid
SERVE_PID_FILE := .serve.pid
SERVE_PORT := 8080

install:
	npm install --ignore-scripts

build:
	@echo "Ejecutando build.sh..."
	./build.sh

dev: install
	@echo "Iniciando esbuild en modo watch..."
	@sh -c 'npx esbuild static/js/main.ts --bundle --outfile=static/js/visor.js --target=es2020 --watch=forever >/tmp/vinpaco-dev.log 2>&1 & echo $$! > $(DEV_PID_FILE)'
	@echo "esbuild watch iniciado (PID $$(cat $(DEV_PID_FILE)))"
	@echo "Salida en /tmp/vinpaco-dev.log"

serve:
	@echo "Iniciando live-server..."
	@sh -c 'npx live-server --no-browser --port=$(SERVE_PORT) >/tmp/vinpaco-serve.log 2>&1 & echo $$! > $(SERVE_PID_FILE)'
	@echo "live-server iniciado (PID $$(cat $(SERVE_PID_FILE)))"
	@echo "Salida en /tmp/vinpaco-serve.log"
	@echo "Abre en el navegador:"
	@echo "http://localhost:$(SERVE_PORT)"

start: dev serve

stop:
	@bash scripts/stop-local.sh

restart:
	@$(MAKE) stop
	@sleep 2
	@$(MAKE) start
