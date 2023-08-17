#!/bin/bash
set -e

ARCH=${ARCH:-x64}
WORKING_DIRECTORY=$(pwd)
TAR_NAME="RedisInsight-v2-app-darwin.$ARCH.tar.gz"
APP_FOLDER_NAME="RedisInsight-v2.app"
TMP_FOLDER="/tmp/$APP_FOLDER_NAME"

rm -rf "$TMP_FOLDER"

mkdir -p "$WORKING_DIRECTORY/release/redisstack"
mkdir -p "$TMP_FOLDER"

hdiutil attach "./release/RedisInsight-v2-mac-$ARCH.dmg"
cp -a /Volumes/RedisInsight-*/RedisInsight-v2.app "/tmp"
cd "/tmp" || exit 1
tar -czvf "$TAR_NAME" "$APP_FOLDER_NAME"
cp "$TAR_NAME" "$WORKING_DIRECTORY/release/redisstack/"
cd "$WORKING_DIRECTORY" || exit 1
hdiutil unmount /Volumes/RedisInsight-*/
