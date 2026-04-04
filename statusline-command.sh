#!/bin/bash

# Read JSON input from stdin
input=$(cat)

# Extract values from JSON
cwd=$(echo "$input" | jq -r '.workspace.current_dir')
model=$(echo "$input" | jq -r '.model.display_name')
used=$(echo "$input" | jq -r '.context_window.used_percentage // 0')
remaining=$(echo "$input" | jq -r '.context_window.remaining_percentage // 0')

# Color definitions (robbyrussell style)
RESET=$(printf '\033[0m')
BOLD=$(printf '\033[1m')
DIM=$(printf '\033[2m')
CYAN=$(printf '\033[38;5;81m')       # Cyan for current dir (robbyrussell style)
RED=$(printf '\033[38;5;196m')       # Red for git arrow/dirty
YELLOW=$(printf '\033[38;5;226m')    # Yellow for git branch
MAGENTA=$(printf '\033[38;5;205m')   # Magenta for model
GREEN=$(printf '\033[38;5;82m')      # Green for context ok / server up
ORANGE=$(printf '\033[38;5;214m')    # Orange for context warning
GRAY=$(printf '\033[38;5;245m')      # Gray for time / secondary info
BLUE=$(printf '\033[38;5;75m')       # Blue for server info

# Current dir — show full path with ~ substitution for home
home_dir="$HOME"
if [ "${cwd#$home_dir}" != "$cwd" ]; then
    display_path="~${cwd#$home_dir}"
else
    display_path="$cwd"
fi
path_info="${BOLD}${CYAN}${display_path}${RESET}"

# Get git branch and status
branch=$(git -C "$cwd" --no-optional-locks branch --show-current 2>/dev/null || echo '')
git_info=""
changed_files=0
if [ -n "$branch" ]; then
    # Count uncommitted changed files
    changed_files=$(git -C "$cwd" --no-optional-locks status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    # Check for dirty working tree
    if [ "$changed_files" -eq 0 ]; then
        git_arrow="${GREEN}"
    else
        git_arrow="${RED}"
    fi
    git_info=" ${git_arrow}git:(${RESET}${BOLD}${RED}${branch}${RESET}${git_arrow})${RESET}"
    if [ "$changed_files" -gt 0 ]; then
        git_info="${git_info} ${YELLOW}~${changed_files}${RESET}"
    fi
fi

# Server status check — read ports from .env.local (priority) > .env > backend/.env
be_port=5001
fe_port=5000
rwf_port=""

read_env() { grep -E "^$1=" "$2" 2>/dev/null | head -1 | cut -d= -f2 | tr -d '[:space:]'; }

for envf in "${cwd}/.env.local" "${cwd}/.env" "${cwd}/backend/.env"; do
    if [ -f "$envf" ]; then
        v=$(read_env BE_PORT "$envf");  [ -n "$v" ] && [ "$be_port" = "5001" ] && be_port="$v"
        v=$(read_env FE_PORT "$envf");  [ -n "$v" ] && [ "$fe_port" = "5000" ] && fe_port="$v"
        v=$(read_env RWF_PORT "$envf"); [ -n "$v" ] && [ -z "$rwf_port" ] && rwf_port="$v"
        v=$(read_env PORT "$envf");     [ -n "$v" ] && [ "$be_port" = "5001" ] && be_port="$v" && fe_port=$((v - 1))
    fi
done

be_up=false; fe_up=false; rwf_up=false
ss -tln 2>/dev/null | grep -q ":${be_port} " && be_up=true
ss -tln 2>/dev/null | grep -q ":${fe_port} " && fe_up=true
[ -n "$rwf_port" ] && ss -tln 2>/dev/null | grep -q ":${rwf_port} " && rwf_up=true

if $be_up; then be_status="${GREEN}BE:${be_port}${RESET}"; else be_status="${RED}BE:off${RESET}"; fi
if $fe_up; then fe_status="${GREEN}FE:${fe_port}${RESET}"; else fe_status="${RED}FE:off${RESET}"; fi

server_info=" ${BLUE}[${RESET}${be_status}${BLUE}|${RESET}${fe_status}"
if [ -n "$rwf_port" ]; then
    if $rwf_up; then rwf_status="${GREEN}RWF:${rwf_port}${RESET}"; else rwf_status="${RED}RWF:off${RESET}"; fi
    server_info="${server_info}${BLUE}|${RESET}${rwf_status}"
fi
server_info="${server_info}${BLUE}]${RESET}"

# Model info
model_info="${BOLD}${MAGENTA}[${model}]${RESET}"

# Context usage
ctx_info=""
if [ -n "$used" ] && [ -n "$remaining" ]; then
    used_int=${used%.*}
    if [ "$used_int" -ge 80 ]; then
        ctx_color="${RED}"
    elif [ "$used_int" -ge 50 ]; then
        ctx_color="${ORANGE}"
    else
        ctx_color="${GREEN}"
    fi
    ctx_info=" ${ctx_color}ctx:${used}%${RESET}"
fi

# Current time
time_info=" ${GRAY}$(date +%H:%M:%S)${RESET}"

# Print 2-line status
# Line 1: path + git info
# Line 2: server info + model + context usage
line1="${path_info}${git_info}"
line2="${server_info:1}${model_info}${ctx_info}"   # strip leading space from server_info

printf "%s\n%s\n" "$line1" "$line2"
