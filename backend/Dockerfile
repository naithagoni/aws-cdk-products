# Use an official Node.js runtime as a parent image
# NOTE: You need to specify explicitly '--platform=linux/amd64' otherwise, ECS throws 'exec /usr/local/bin/docker-entrypoint.sh exec format error'
FROM --platform=linux/amd64 node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.jsong to the working directory
COPY package*.json /app

# Install app dependencies
RUN npm install

# Bundle app source
COPY . /app

# Expose the port the app will run on
EXPOSE 80

# Define the command to run your application
CMD ["npm", "start"]