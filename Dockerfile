# Use the official Node.js image
FROM node:lts-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml (or pnpmfile.js) to install dependencies
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Bundle app source
COPY . .

RUN pnpm build

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["pnpm", "start:prod"]
