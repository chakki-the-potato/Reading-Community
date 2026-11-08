import io
import os
import sys
from contextlib import redirect_stdout

import check_verification as cv


def run_check(workdir: str, argv: list[str]) -> str:
    os.chdir(workdir)
    sys.argv = ['check_verification.py', *argv]
    log = io.StringIO()
    with redirect_stdout(log):
        cv.main()
    return log.getvalue()
