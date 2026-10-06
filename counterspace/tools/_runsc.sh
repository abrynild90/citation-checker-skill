#!/bin/bash
cd /home/user/citation-checker-skill/.claude/worktrees/g-s11b/counterspace
for id in "$@"; do
  ONLY=$id VPS=1440,375,900 PORT=9747 OUT=/tmp/b11cap/sc_$id node tools/scene_check.mjs > /tmp/b11cap/sc_$id.txt 2>&1
  echo "$id done" >> /tmp/b11cap/sc_done.txt
done
