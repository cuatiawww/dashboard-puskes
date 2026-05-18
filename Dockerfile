FROM node:lts-alpine

WORKDIR /app

RUN chown -R node:node /app

USER node

COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node . .

ARG GOOGLE_AI_API_KEY

RUN echo "GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}" >> .env

ARG DASHBOARD_FASKES_BASE_URL

RUN echo "DASHBOARD_FASKES_BASE_URL=${DASHBOARD_FASKES_BASE_URL}" >> .env

ARG DASHBOARD_FASKES_TOKEN

RUN echo "DASHBOARD_FASKES_TOKEN=${DASHBOARD_FASKES_TOKEN}" >> .env



RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "HOST=0.0.0.0 PORT=3000 npm start"]
