#!/bin/bash
cd /home/user/citation-checker-skill/.claude/worktrees/g-s8b/counterspace
for id in solwind dn2 starfish cosmos1408 viasat sj21-tug laser; do
  ONLY=$id VPS=1440,375,900 OUT=/tmp/claude-0/-home-user-citation-checker-skill/a512a4f7-356b-5da7-ae6f-7a7ae5194032/scratchpad/s8/sc_$id PORT=9933 node tools/scene_check.mjs > /tmp/claude-0/-home-user-citation-checker-skill/a512a4f7-356b-5da7-ae6f-7a7ae5194032/scratchpad/s8/chk_$id.txt 2>&1
  echo done $id >> /tmp/claude-0/-home-user-citation-checker-skill/a512a4f7-356b-5da7-ae6f-7a7ae5194032/scratchpad/s8/chk_done.txt
done
