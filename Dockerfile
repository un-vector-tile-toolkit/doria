FROM arm32v7/node:latest
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && \
  apt-get -y --no-install-recommends install apt-utils && \
  apt-get -y upgrade && \
  apt-get -y install curl wget gnupg

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN apt-get update && \
  apt-get -y upgrade && \
  apt-get -y install build-essential llvm clang clang-tidy clang-format && \
  apt-get -y install nodejs yarn && \
  apt-get -y install libsqlite3-dev zlib1g-dev && \
  apt-get -y install libmapnik-dev

RUN mkdir -p /tmp/doria-src
WORKDIR /tmp/doria-src
COPY . /tmp/doria-src

RUN yarn

