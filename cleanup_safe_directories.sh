#!/bin/bash
#
# OpenEMR Safe Directory Cleanup Script
# Generated: 2026-01-16
# Based on custom code dependency analysis
#
# This script removes directories that are NOT used by custom code.
# Total space savings: ~57MB
#

set -e  # Exit on error

OPENEMR_ROOT="/home/user/sacwan-openemr-mh"
cd "$OPENEMR_ROOT"

echo "=========================================="
echo "OpenEMR Directory Cleanup"
echo "=========================================="
echo ""
echo "This will remove the following directories:"
echo "  - contrib/     (39MB)"
echo "  - swagger/     (8.7MB)"
echo "  - tests/       (5.0MB)"
echo "  - docker/      (2.3MB)"
echo "  - portal/      (2.1MB)"
echo "  - ccdaservice/ (1.1MB)"
echo "  - ci/          (251K)"
echo "  - controllers/ (163K)"
echo "  - database/    (18K)"
echo "  - sphere/      (17K)"
echo "  - bin/         (12K)"
echo ""
echo "Total savings: ~57MB (docs/ excluded - contains YOUR documentation)"
echo ""
echo "WARNING: This is permanent! Make a backup if unsure."
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Removing directories..."

# Remove directories one by one with status
remove_dir() {
    local dir="$1"
    if [ -d "$dir" ]; then
        echo "  Removing $dir..."
        rm -rf "$dir"
        echo "    ✓ Removed"
    else
        echo "  Skipping $dir (not found)"
    fi
}

remove_dir "contrib"
remove_dir "swagger"
remove_dir "tests"
remove_dir "docker"
remove_dir "portal"
remove_dir "ccdaservice"
remove_dir "ci"
remove_dir "controllers"
remove_dir "database"
remove_dir "sphere"
remove_dir "bin"

echo ""
echo "=========================================="
echo "Cleanup Complete!"
echo "=========================================="
echo ""
echo "Removed directories successfully."
echo ""
echo "REQUIRED directories are still intact:"
echo "  ✓ vendor/ (to be installed)"
echo "  ✓ src/"
echo "  ✓ library/"
echo "  ✓ interface/"
echo "  ✓ sites/"
echo "  ✓ ccr/"
echo "  ✓ public/"
echo "  ✓ gacl/"
echo "  ✓ templates/"
echo "  ✓ config/"
echo "  ✓ custom/ (YOUR backend API code)"
echo "  ✓ react-frontend/ (YOUR React source code)"
echo "  ✓ app/ (YOUR built React app)"
echo "  ✓ docs/ (YOUR project documentation)"
echo "  ✓ apis/"
echo ""
echo "Next steps:"
echo "  1. Run: composer install (to create vendor/ directory)"
echo "  2. Test your application to ensure everything works"
echo ""
