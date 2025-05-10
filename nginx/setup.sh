#!/bin/bash

# Check if Nginx is installed
if ! [ -x "$(command -v nginx)" ]; then
    echo "Error: Nginx is not installed." >&2
    echo "Please install Nginx first." 
    exit 1
fi

# Set up Nginx configuration
echo "Setting up Nginx configuration..."

# Copy nginx.conf to appropriate directory (adjust as needed)
cp nginx/nginx.conf /etc/nginx/nginx.conf

# Check Nginx configuration for errors
nginx -t

# Restart Nginx to apply the configuration
echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "Nginx setup complete."
