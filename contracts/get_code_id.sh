#!/bin/bash

echo $(junod query tx $1 --output json | jq -r '.logs[0].events[-1].attributes[0].value')
