.PHONY: install dev serve start stop build

DEV_PID_FILE := .dev.pid
SERVE_PID_FILE := .serve.pid

install:
	npm install

build:
	@echo "Ejecutando build.sh..."
	./build.sh

dev: install
	@echo "Iniciando esbuild en modo watch..."
	@nohup npx esbuild static/js/main.ts --bundle --outfile=static/js/visor.js --target=es2020 --watch=forever >/tmp/vinpaco-dev.log 2>&1 &
	@echo $$! > $(DEV_PID_FILE)
	@echo "esbuild watch iniciado (PID $$(cat $(DEV_PID_FILE)))"
	@echo "Salida en /tmp/vinpaco-dev.log"

serve:
	@echo "Iniciando live-server..."
	@nohup npx live-server --no-browser >/tmp/vinpaco-serve.log 2>&1 &
	@echo $$! > $(SERVE_PID_FILE)
	@echo "live-server iniciado (PID $$(cat $(SERVE_PID_FILE)))"
	@echo "Salida en /tmp/vinpaco-serve.log"
    @echo "Abre en el navegador:  "
	@echo "http://localhost:8080"

stop:
	@echo "Deteniendo servidores locales..."
	-@kill "$$(cat $(DEV_PID_FILE) 2>/dev/null)" 2>/dev/null || true
	-@kill "$$(cat $(SERVE_PID_FILE) 2>/dev/null)" 2>/dev/null || true
	-@rm -f $(DEV_PID_FILE) $(SERVE_PID_FILE)
	@echo "Detenido."
	
