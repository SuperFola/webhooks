# GitHub webhooks provider

Create webhooks to receive GitHub push events and automatically update projects!

## Why?

I manage multiple web projects (like https://arkscript-lang.dev and https://playground.arkscript-lang.dev), which are deployed on a VPS I own. Whenever I update one or the other, I need to remember to go to the VPS, `git pull` and all, so that the new version can be deployed. I could have easily used `cron`, but I must have messed it up because it didn't trigger on my server (or perhaps the permissions were wrong on my update script).

It's also much funnier to reinvente the wheel!

## How to use

This project assumes you have a reverse proxy, such as [nginx-proxy-manager](https://github.com/NginxProxyManager/nginx-proxy-manager), and own a domain name.

Folder structure:

```
docker/
      docker-compose.yml
      webhooks/
              Dockerfile
              app.js
              routes.json
      website/
      project/
      .../
```

Docker compose setup:

```yaml
services:
    proxy_manager:
        image: 'jc21/nginx-proxy-manager:latest'
        restart: unless-stopped
        ports:
            - 80:80
            - 443:443
            - 81:81
        volumes:
            - ./data:/data
            - ./letsencrypt:/etc/letsencrypt
        networks:
            - proxy_network

    webhooks:
        build: ./webhooks/
        container_name: webhooks
        user: "node"
        working_dir: /home/node/app
        command: "node app.js"
        expose:
            - 5000
        environment:
            - NODE_ENV=production
        volumes:
            - ./webhooks:/home/node/app
            - ./:/docker
        depends_on:
            - proxy_manager
        networks:
            - proxy_network
        restart: unless-stopped

networks:
    proxy_network:
```

Then add your routes under `docker/webhooks/routes.json`, copying the structure of `routes.jsons.example`. The `secret` can be anything you want, just remember to put it in the GitHub webhook creation interface.

> [!IMPORTANT]
> Your webhook must use the same secret as the one in your `routes.json`.
> It also must be set to `application/json`

The webhook is configured to check for the secret, so that if it matches only GitHub can call it. Then it will `git pull` the specified project!

