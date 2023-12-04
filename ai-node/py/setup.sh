#!/bin/bash

# This script sets up the Python part of the AI inference node

# Check if pip is `pip` or `pip3`
if [[ $(which pip) == "" ]]; then
    PIP=pip3
else
    PIP=pip
fi

# Clone the Shap-E repository
git clone https://github.com/openai/shap-e.git

# Install Shap-E dependencies
$PIP install --break-system-packages -e .

# Install NikolausDAO dependencies
$PIP install --break-system-packages -r requirements.txt

# Copy inference script into Shap-E
cp nikolausdao_inference.py shap-e/nikolausdao_inference.py
