"""Resolve the component workspace without depending on the caller's directory."""
import os
from pathlib import Path

def workspace_root():
    default = Path(__file__).resolve().parents[3] / 'springbootrestdemo'
    root = Path(os.environ.get('SHARITY_WORKSPACE_ROOT', str(default))).resolve()
    if not root.is_dir():
        raise RuntimeError('Set SHARITY_WORKSPACE_ROOT to the component checkout directory')
    (root / 'outputs').mkdir(exist_ok=True)
    return root

def docs_root():
    default = workspace_root().parent / 'docs'
    if not default.is_dir():
        default = Path(__file__).resolve().parents[2] / 'docs/sharity'
    return Path(os.environ.get('SHARITY_DOCS_ROOT', str(default))).resolve()
