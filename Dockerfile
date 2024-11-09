# Use a base image with Node.js
FROM node:16-slim

# Install dependencies for running browsers
RUN apt-get update && apt-get install -y \
  wget \
  gnupg \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Install Playwright and its dependencies
COPY package*.json ./

RUN npm install
RUN npx playwright install

# Copy the rest of your application code
COPY . .

# Expose a port (change as needed)
EXPOSE 3000

EXPOSE 8080

# Define the entry point for your application
CMD ["npm", "run", "dev"]

#FROM node:16
#EXPOSE 3000

#EXPOSE 8080

#docker pull gprakhar/meta:latest

#docker run --rm gprakhar/meta:latest