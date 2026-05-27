#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
RUN_DIR="$ROOT_DIR/.run"
LOG_DIR="$ROOT_DIR/logs"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"

get_lan_ip() {
	hostname -I 2>/dev/null | awk '{print $1}'
}

LAN_IP="$(get_lan_ip || true)"
ACCESS_HOST="${LAN_IP:-localhost}"
FRONTEND_URL="http://${ACCESS_HOST}:8100"
BACKEND_URL="http://${ACCESS_HOST}:3000"

mkdir -p "$RUN_DIR" "$LOG_DIR"

is_running() {
	local pid="${1:-}"
	[[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

start_service() {
	local name="$1"
	local pid_file="$2"
	local log_file="$3"
	local command="$4"
	local workdir="$5"

	if [[ -f "$pid_file" ]] && is_running "$(cat "$pid_file")"; then
		echo "$name ya está ejecutándose (PID $(cat "$pid_file"))."
		return 0
	fi

	(
		cd "$workdir"
		nohup bash -lc "$command" > "$log_file" 2>&1 &
		echo $! > "$pid_file"
	)

	echo "$name iniciado (PID $(cat "$pid_file"))."
}

stop_service() {
	local name="$1"
	local pid_file="$2"

	if [[ ! -f "$pid_file" ]]; then
		echo "$name no está ejecutándose."
		return 0
	fi

	local pid
	pid="$(cat "$pid_file")"

	if is_running "$pid"; then
		kill "$pid" 2>/dev/null || true

		for _ in {1..20}; do
			if ! is_running "$pid"; then
				break
			fi
			sleep 0.2
		done

		if is_running "$pid"; then
			kill -9 "$pid" 2>/dev/null || true
		fi

		echo "$name detenido (PID $pid)."
	else
		echo "$name no estaba activo."
	fi

	rm -f "$pid_file"
}

status_service() {
	local name="$1"
	local pid_file="$2"

	if [[ -f "$pid_file" ]] && is_running "$(cat "$pid_file")"; then
		echo "$name: activo (PID $(cat "$pid_file"))."
	else
		echo "$name: detenido."
	fi
}

start_all() {
	start_service "Backend" "$BACKEND_PID_FILE" "$LOG_DIR/backend.log" "npm run start:dev" "$BACKEND_DIR"
	start_service "Frontend" "$FRONTEND_PID_FILE" "$LOG_DIR/frontend.log" "npm start -- --host 0.0.0.0 --port 8100" "$ROOT_DIR"
	echo
	echo "Acceso:" 
	echo "- Frontend: $FRONTEND_URL"
	echo "- Backend:  $BACKEND_URL"
	if [[ -n "${LAN_IP:-}" ]]; then
		echo "- Desde tu móvil en la misma red: http://${LAN_IP}:8100"
	fi
}

stop_all() {
	stop_service "Frontend" "$FRONTEND_PID_FILE"
	stop_service "Backend" "$BACKEND_PID_FILE"
}

status_all() {
	status_service "Frontend" "$FRONTEND_PID_FILE"
	status_service "Backend" "$BACKEND_PID_FILE"
}

case "${1:-start}" in
	start)
		start_all
		;;
	stop)
		stop_all
		;;
	restart)
		stop_all
		start_all
		;;
	status)
		status_all
		;;
	*)
		echo "Uso: $0 {start|stop|restart|status}"
		exit 1
		;;
esac
