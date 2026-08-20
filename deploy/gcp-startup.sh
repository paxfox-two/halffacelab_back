#!/bin/bash
# GCE startup script: installs Docker Engine + the compose plugin on a
# stock Ubuntu 22.04 image. Runs once, as root, on first boot.
set -euo pipefail

apt-get update
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Let human login users run docker without sudo. Don't assume uid 1000 —
# OS Login (the default on GCE) provisions the SSHing user at uid 1001+,
# not the baked-in "ubuntu" account, so grant every real user account.
for u in $(awk -F: '$3 >= 1000 && $3 < 60000 {print $1}' /etc/passwd); do
  usermod -aG docker "$u" || true
done
