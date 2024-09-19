# syntax=docker/dockerfile:1.2

FROM node:18-alpine

RUN set -x \
    && . /etc/os-release \
    && case "$ID" in \
        alpine) \
            apk add --no-cache bash git openssh curl \
            ;; \
        debian) \
            apt-get update \
            && apt-get -yq install bash git openssh-server curl \
            && apt-get -yq clean \
            && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
            ;; \
    esac \
    # show installed application versions
    && git --version && bash --version && ssh -V && npm -v && node -v && curl --version
