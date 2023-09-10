FROM node:18.17-alpine3.18
WORKDIR /srv/app
COPY . /srv/app
RUN apk add poppler-utils git
RUN npm i --omit=dev
EXPOSE 3000
ENTRYPOINT [ "npm", "start" ]
