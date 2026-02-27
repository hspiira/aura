.PHONY: audit-deps lint test test-all

audit-deps:
	uv run pip-audit

lint:
	uv run black --check app tests
	uv run isort --check-only app tests
	uv run flake8 app tests
	uv run mypy app

lint-fix:
	uv run black app tests
	uv run isort app tests

test:
	uv run pytest -m "not requires_db" -v

test-all:
	uv run pytest -v
