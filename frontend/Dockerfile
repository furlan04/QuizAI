FROM node:20-alpine AS build
WORKDIR /app

ARG REACT_APP_AUTH_SERVICE_URL=http://localhost:5001
ARG REACT_APP_QUIZ_SERVICE_URL=http://localhost:8080
ARG REACT_APP_USER_SERVICE_URL=http://localhost:5002

ENV REACT_APP_AUTH_SERVICE_URL=$REACT_APP_AUTH_SERVICE_URL
ENV REACT_APP_QUIZ_SERVICE_URL=$REACT_APP_QUIZ_SERVICE_URL
ENV REACT_APP_USER_SERVICE_URL=$REACT_APP_USER_SERVICE_URL

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
