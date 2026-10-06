#!/bin/bash
# usage: _rc.sh id  -> runs the check in background, writes chk_<id>.txt
cd /home/user/citation-checker-skill/.claude/worktrees/g-s8b/counterspace
S=/tmp/claude-0/-home-user-citation-checker-skill/a512a4f7-356b-5da7-ae6f-7a7ae5194032/scratchpad/s8
rm -f $S/chk_$1.txt
ONLY=$1 VPS=1440,375,900 OUT=$S/sc_$1 PORT=9934 node tools/scene_check.mjs > $S/chk_$1.txt 2>&1
echo fin >> $S/chk_$1.txt
