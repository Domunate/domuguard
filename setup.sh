#!/bin/bash

# Install dependencies
npm install

# Create necessary directories
mkdir -p public/avatars

# Copy default avatar
cp src/assets/default-avatar.png public/avatars/01.png

# Start development server
npm run dev 
