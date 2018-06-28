#!/bin/sh
# start daemon
screen -dmS screenGroupbot bash -c 'CISCOSPARK_ACCESS_TOKEN=$CISCOSPARK_ACCESS_TOKEN nodejs . 2>&1 | tee server.log'
