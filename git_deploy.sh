#!/bin/bash
# Git Deployment Script for Unified Field Suite
# Automates repository initialization and GitHub push

set -e

echo "=============================================="
echo "Unified Field Suite - Git Deployment Script"
echo "=============================================="
echo

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "[INIT] Initializing Git repository..."
    git init
    echo "✓ Git repository initialized"
else
    echo "✓ Git repository already exists"
fi

echo

# Configure git user (optional - user should set these)
echo "[CONFIG] Checking Git configuration..."
if [ -z "$(git config user.name)" ]; then
    echo "⚠ Warning: Git user.name not configured."
    echo "  Run: git config --global user.name 'Your Name'"
fi
if [ -z "$(git config user.email)" ]; then
    echo "⚠ Warning: Git user.email not configured."
    echo "  Run: git config --global user.email 'your@email.com'"
fi
echo

# Add all files
echo "[STAGE] Adding all files to staging area..."
git add README.md requirements.txt unified_field_suite.py test_unified_field_suite.py benchmark_suite.py git_deploy.sh
echo "✓ Files staged for commit"
echo

# Create initial commit
echo "[COMMIT] Creating initial commit..."
git commit -m "Initial commit: Unified Field Suite with Einstein Memorial Dedication

This monolithic library bridges Quantum-Geometric Cosmology and Decentralized Multi-Agent Systems.

Features:
- Palatini-Maxwell torsion field unification
- Parisi-Wu stochastic quantization
- HJB optimal control with tanh saturation
- Lyapunov spectrum stability analysis
- KL-divergence information tracking
- Geodesic data routing engine
- Hartle-Hawking wave function evaluation
- Functional Renormalization Group flow
- Holographic CFT boundary mapping

Dedicated to Albert Einstein (1879-1955)"
echo "✓ Initial commit created"
echo

# Check for remote
if ! git remote get-url origin &>/dev/null; then
    echo "[REMOTE] No remote 'origin' configured."
    echo
    echo "To push to GitHub, run:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/stochastic-field-unification.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    echo
    echo "Or for SSH:"
    echo "  git remote add origin git@github.com:YOUR_USERNAME/stochastic-field-unification.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
else
    echo "[PUSH] Remote 'origin' found. Pushing to GitHub..."
    git branch -M main 2>/dev/null || true
    git push -u origin main
    echo "✓ Successfully pushed to GitHub"
fi

echo
echo "=============================================="
echo "Deployment Complete!"
echo "=============================================="
echo
echo "Next Steps:"
echo "1. If not already done, create a new repository on GitHub"
echo "2. Run the commands shown above to connect and push"
echo "3. Visit your GitHub repository to verify the upload"
echo
