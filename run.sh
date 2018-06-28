#!/bin/sh
screen -dmS screenGroupbot bash -c 'CISCOSPARK_ACCESS_TOKEN=$CISCOSPARK_ACCESS_TOKEN nodejs . | tee server.log'
