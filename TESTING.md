# Chapi Fit automatic regression tests

From the repository root:

```bash
python -m pip install playwright
python -m playwright install chromium
python run_checks.py
```

`node` v22 and Python 3.11 are used in CI. The runner executes the Node test suite and four Chromium DOM regression scripts. Output is written under `artifacts/summary.json` and `artifacts/*.log`. On failure, browser tests can save screenshots and tracebacks there. A nonzero exit code indicates failure.

This browser harness injects the local app into Chromium with a mocked `localStorage`. It is **not** an HTTP-hosted end-to-end test or an iOS Safari test. Review the workflow before enabling it in a repository with deployment actions.

CI draft: `.github/workflows/chapi-fit-tests.yml`. This file has not been executed on GitHub Actions yet.
