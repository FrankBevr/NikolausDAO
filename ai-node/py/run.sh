#!/bin/bash

# This script runs the Python part of the AI inference node

# Check if Python is `python` or `python3`
if [[ $(which python) == "" ]]; then
    PYTHON=python3
else
    PYTHON=python
fi

pushd shap-e
$PYTHON -m flask --app nikolausdao_inference run --host 0.0.0.0 --port 5000
