#!/bin/sh

while :
do
  yarn build || true

  # wait 60 seconds
  sleep 60
done