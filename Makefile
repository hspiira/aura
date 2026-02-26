.PHONY: audit-deps test test-all

audit-deps:
	uv run pip-audit

test:
	uv run pytest -m "not requires_db" -v

test-all:
	uv run pytest -v
