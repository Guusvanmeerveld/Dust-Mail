#!/bin/sh

nginx -g "daemon off;" & node dist/main && fg