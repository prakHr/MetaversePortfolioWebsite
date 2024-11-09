# Use official Node.js image
FROM node:16

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the application port
EXPOSE 3000

# Expose the application port
EXPOSE 8080

# Run the application
CMD ["npm", "run", "dev"]
