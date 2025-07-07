#!/bin/bash

# Deployment script to fix the gallery shell compatibility issues
# Run this script to automatically deploy the fixed versions

echo "======================================"
echo "Dynamic Gallery - Shell Compatibility Fix"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "compress.sh" ] || [ ! -f "dirmonitor.sh" ]; then
    echo "ERROR: Please run this script from the gallery directory containing compress.sh and dirmonitor.sh"
    exit 1
fi

# Create backup directory
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup existing scripts
if [ -f "compress.sh" ]; then
    cp compress.sh "$BACKUP_DIR/"
    echo "Backed up compress.sh"
fi

if [ -f "dirmonitor.sh" ]; then
    cp dirmonitor.sh "$BACKUP_DIR/"
    echo "Backed up dirmonitor.sh"
fi

echo ""
echo "Choose deployment option:"
echo "1) POSIX-only scripts (Recommended for containers)"
echo "2) Bash-preferred scripts (Works in both environments)"
echo "3) Just show current script status"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "Deploying POSIX-only scripts..."
        if [ -f "compress-posix.sh" ]; then
            cp compress-posix.sh compress.sh
            echo "✓ Deployed compress-posix.sh -> compress.sh"
        else
            echo "ERROR: compress-posix.sh not found"
            exit 1
        fi
        
        if [ -f "dirmonitor-posix.sh" ]; then
            cp dirmonitor-posix.sh dirmonitor.sh
            echo "✓ Deployed dirmonitor-posix.sh -> dirmonitor.sh"
        else
            echo "ERROR: dirmonitor-posix.sh not found"
            exit 1
        fi
        ;;
    2)
        echo "Using updated bash-preferred scripts (already in place)..."
        echo "✓ Using existing compress.sh and dirmonitor.sh"
        ;;
    3)
        echo "Current script status:"
        echo ""
        echo "=== compress.sh ==="
        head -5 compress.sh
        echo ""
        echo "=== dirmonitor.sh ==="
        head -5 dirmonitor.sh
        echo ""
        echo "=== Available alternatives ==="
        ls -la *posix.sh 2>/dev/null || echo "No POSIX alternatives found"
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Make scripts executable
chmod +x compress.sh dirmonitor.sh
echo "✓ Made scripts executable"

# Test basic syntax
echo ""
echo "Testing script syntax..."

if sh -n compress.sh; then
    echo "✓ compress.sh syntax OK"
else
    echo "✗ compress.sh has syntax errors"
    exit 1
fi

if sh -n dirmonitor.sh; then
    echo "✓ dirmonitor.sh syntax OK"
else
    echo "✗ dirmonitor.sh has syntax errors"
    exit 1
fi

echo ""
echo "======================================"
echo "Deployment completed successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Kill any running dirmonitor processes:"
echo "   pkill -f dirmonitor"
echo ""
echo "2. Test compression manually:"
echo "   ./compress.sh"
echo ""
echo "3. Start the directory monitor:"
echo "   nohup ./dirmonitor.sh > dirmonitor.log 2>&1 &"
echo "   # or use screen:"
echo "   screen -S gallery-monitor ./dirmonitor.sh"
echo ""
echo "4. Check the frontend:"
echo "   # Visit your gallery URL to verify thumbnails load"
echo ""
echo "Backups saved in: $BACKUP_DIR"
