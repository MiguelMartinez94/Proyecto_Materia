FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

EXPOSE 8082

CMD ["npm", "start", "--", "--port", "8082"]
