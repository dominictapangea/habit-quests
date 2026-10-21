# Node runs the TypeScript sources directly (type stripping) and SQLite comes
# with Node (node:sqlite), so there is no build step and no native module.
FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0 \
    DB_PATH=/data/habit-quests.db

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

VOLUME /data
EXPOSE 3001
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.ts"]
