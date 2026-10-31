.PHONY: all install build build-contracts build-packages build-backend build-frontend test test-contracts test-backend test-frontend lint format clean docker-up docker-down

all: install build test

install:
	npm install
	cargo check --manifest-path Cargo.toml

build: build-contracts build-packages build-backend build-frontend

build-contracts:
	cargo build --release --target wasm32-unknown-unknown

build-packages:
	npm run build --workspace=@stellar-guard/types

build-backend:
	cd backend && npx tsc --noEmit

build-frontend:
	cd frontend && npm run build

test: test-contracts test-backend test-frontend

test-contracts:
	cargo test --verbose

test-backend:
	cd backend && npm test

test-frontend:
	cd frontend && npm test

lint:
	npm run lint || true
	cargo fmt --all -- --check
	cargo clippy --all-targets -- -D warnings

format:
	npm run format || true
	cargo fmt --all

docker-up:
	docker compose up -d

docker-down:
	docker compose down -v

clean:
	cargo clean
	rm -rf dist build .next coverage node_modules

