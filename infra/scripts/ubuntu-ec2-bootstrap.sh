#!/bin/bash
#
# Ubuntu EC2 bootstrap for OppSkills backend
#
# What it does:
# - Installs Docker, AWS CLI v2, Nginx
# - Enables/starts services
# - Creates an application directory (/opt/oppskills)
#
# What it does NOT do (by design):
# - Does not configure SSL certificates (domain dependent)
# - Does not open security group ports (AWS console/terraform)
# - Does not create IAM roles/policies (AWS console/terraform)
#
# Usage (on the EC2 instance):
#   chmod +x infra/scripts/ubuntu-ec2-bootstrap.sh
#   sudo ./infra/scripts/ubuntu-ec2-bootstrap.sh
#
set -euo pipefail

export DEBIAN_FRONTEND="noninteractive"

echo "[bootstrap] Updating apt..."
apt-get update -y

echo "[bootstrap] Installing base packages..."
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  unzip

echo "[bootstrap] Installing Docker (official repo)..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

DOCKER_REPO="deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${VERSION_CODENAME}") stable"
echo "${DOCKER_REPO}" > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y --no-install-recommends docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

echo "[bootstrap] Installing Nginx..."
apt-get install -y --no-install-recommends nginx
systemctl enable nginx
systemctl start nginx

echo "[bootstrap] Installing AWS CLI v2..."
tmp_dir="$(mktemp -d)"
pushd "${tmp_dir}" >/dev/null
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install --update
popd >/dev/null
rm -rf "${tmp_dir}"

echo "[bootstrap] Creating /opt/oppskills..."
mkdir -p /opt/oppskills
chmod 0755 /opt/oppskills

echo "[bootstrap] Done."
echo "[bootstrap] Next:"
echo "  - Attach an instance role with SecretsManager + ECR read permissions"
echo "  - Configure Nginx site in /etc/nginx/sites-available/"
echo "  - Add SSL via certbot (optional but recommended)"


