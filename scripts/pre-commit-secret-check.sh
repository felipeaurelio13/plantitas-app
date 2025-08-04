#!/bin/bash

# Pre-commit hook to detect potential secrets
# This script checks for common secret patterns before allowing commits

echo "🔍 Checking for potential secrets..."

# Patterns to check for
PATTERNS=(
    "sk-[a-zA-Z0-9]{48}"           # OpenAI API keys
    "pk_[a-zA-Z0-9]{48}"           # Supabase keys
    "eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*"  # JWT tokens
    "AIza[A-Za-z0-9_-]{35}"        # Firebase API keys
    "[a-zA-Z0-9]{32,}"             # Generic long strings that might be secrets
)

# Files to exclude
EXCLUDE_PATTERNS=(
    "node_modules"
    ".git"
    "dist"
    "build"
    "coverage"
    "*.test.ts"
    "*.test.tsx"
    "*.spec.ts"
    "*.spec.tsx"
    "test-*"
    "*.md"
)

# Build exclude string
EXCLUDE_STRING=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_STRING="$EXCLUDE_STRING -not -path '*/$pattern/*'"
done

# Check each pattern
FOUND_SECRETS=false

for pattern in "${PATTERNS[@]}"; do
    # Use find to get files and grep to search
    FILES=$(eval "find . -type f -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.json' -o -name '*.env*' $EXCLUDE_STRING")
    
    for file in $FILES; do
        if [ -f "$file" ]; then
            MATCHES=$(grep -E "$pattern" "$file" 2>/dev/null)
            if [ ! -z "$MATCHES" ]; then
                echo "⚠️  Potential secret found in $file:"
                echo "$MATCHES" | sed 's/^/  /'
                FOUND_SECRETS=true
            fi
        fi
    done
done

if [ "$FOUND_SECRETS" = true ]; then
    echo ""
    echo "❌ Potential secrets detected! Please review the files above."
    echo "   If these are false positives (test data, examples), you can proceed."
    echo "   If they are real secrets, remove them before committing."
    echo ""
    echo "   To proceed anyway, use: git commit --no-verify"
    exit 1
else
    echo "✅ No potential secrets detected."
    exit 0
fi