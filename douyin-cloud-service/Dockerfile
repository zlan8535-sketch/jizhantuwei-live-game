FROM node:20-alpine

WORKDIR /opt/application

COPY package.json server.js run.sh ./
RUN chmod +x /opt/application/run.sh

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["/opt/application/run.sh"]
