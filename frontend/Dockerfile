# frontend/Dockerfile

# 1) Build stage
FROM node:20.18.6-alpine AS builder
WORKDIR /app

# package-lock.json 이 있을 경우 함께 복사하세요
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# 2) Runtime stage: serve로 정적 파일 제공
FROM node:20.18.6-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5000"]

