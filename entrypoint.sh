#!/bin/sh

adduser -u "$(id -u)" user
# shellcheck disable=SC2117
su user

while :
do
  yarn build || true

  # wait 60 seconds
  sleep 60
done