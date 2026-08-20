# 배포 — 임시 GCP → 추후 Gabia 이전

`docker-compose.yml` 하나로 postgres + migrate + backend + caddy(프론트엔드 정적 파일 서빙 + `/api` 리버스 프록시 + 자동 HTTPS)가 전부 뜬다. GCP든 Gabia든 **Docker가 도는 리눅스 VM이면 그대로 옮겨진다** — 이 문서에서 GCP 전용 부분은 "1. GCP에 VM 만들기"뿐이고, 그 이후는 순수 Docker Compose라 호스팅사와 무관하다.

아직 도메인이 없으므로 [nip.io](https://nip.io)(무료 wildcard DNS: `1.2.3.4.nip.io`가 `1.2.3.4`로 자동 resolve)로 임시 HTTPS를 받는다. caddy가 Let's Encrypt 인증서를 자동으로 발급하므로, VM의 외부 IP만 알면 별도 DNS 설정 없이 바로 HTTPS가 된다. 실제 도메인이 생기면 `.env`의 `DOMAIN` 한 줄만 바꾸면 된다.

카메라 화면(`getUserMedia`)은 HTTPS 없이는 브라우저가 아예 막기 때문에, 이 HTTPS 설정은 선택이 아니라 필수다.

## 0. 준비물

- 로컬 또는 [Cloud Shell](https://console.cloud.google.com/)에서 `gcloud` 인증 완료, 프로젝트/결제 계정 준비됨
- 아래 `PROJECT_ID`를 실제 GCP 프로젝트 ID로 바꿔서 사용

```sh
export PROJECT_ID=여기에-프로젝트-ID
gcloud config set project "$PROJECT_ID"
```

## 1. GCP에 VM 만들기

```sh
# 80/443/22 방화벽 허용 (SSH는 GCP 기본 네트워크에 보통 이미 열려 있지만 명시)
gcloud compute firewall-rules create allow-web \
  --allow=tcp:80,tcp:443,tcp:22 \
  --target-tags=web

# VM 생성 — e2-medium 권장: 이미지 빌드(npm ci + vite build + tsc)를
# VM 위에서 직접 돌리기 때문에 e2-small(2GB RAM)은 프론트엔드 빌드 중
# OOM이 날 수 있음. 디스크도 여유 있게 30GB.
gcloud compute instances create halfface-lab \
  --zone=asia-northeast3-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=web \
  --metadata-from-file=startup-script=deploy/gcp-startup.sh
```

외부 IP 확인:

```sh
gcloud compute instances describe halfface-lab \
  --zone=asia-northeast3-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

이 IP를 `1.2.3.4`라고 하면, 임시 도메인은 `1-2-3-4.nip.io` 형태가 아니라 **점을 그대로 쓴** `1.2.3.4.nip.io`다 (nip.io는 점 표기를 그대로 지원).

## 2. SSH 접속 후 배포

startup-script가 Docker를 설치하는 데 1~2분 걸리니 살짝 기다렸다가 접속:

```sh
gcloud compute ssh halfface-lab --zone=asia-northeast3-a
```

VM 안에서:

```sh
git clone https://github.com/paxfox-two/halffacelab_back.git app
cd app
cp .env.example .env
# .env 편집: JWT_SECRET을 실제 랜덤 값으로, DOMAIN을 위에서 확인한 nip.io 주소로
nano .env

docker compose up -d --build
docker compose ps        # 4개 서비스 모두 running/healthy 확인
docker compose logs -f caddy   # 인증서 발급 로그 확인 (수 초~수십 초 소요)
```

## 3. 확인

브라우저에서 `https://<DOMAIN>` 접속 (예: `https://1.2.3.4.nip.io`). 홈 화면이 뜨고, 카메라 권한 프롬프트가 정상적으로 나오면 HTTPS가 제대로 동작하는 것.

문제 생기면:

```sh
docker compose logs backend
docker compose logs caddy
curl -s http://127.0.0.1:3000/api/v1/health   # 백엔드 단독 확인 (호스트에서만 접근 가능)
```

## 4. 업데이트 재배포

```sh
cd ~/app
git pull
docker compose up -d --build
```

## 5. GCP 정리 (비용 발생 방지)

"임시"이므로, Gabia로 옮긴 뒤에는 반드시 지울 것 — 켜두면 계속 과금된다.

```sh
gcloud compute instances delete halfface-lab --zone=asia-northeast3-a
gcloud compute firewall-rules delete allow-web
```

## 6. 나중에 Gabia로 이전

1. Gabia에서 (도커 지원되는) VM/클라우드 서버 생성, Ubuntu 기준 `deploy/gcp-startup.sh`와 같은 방식으로 Docker 설치 (GCP 전용 로직 없음, 그대로 재사용 가능).
2. 그 서버에 저장소 clone, `.env` 작성 — 이때 `DOMAIN`을 실제 보유 도메인으로 지정하고, 그 도메인의 A 레코드를 Gabia 서버의 IP로 설정.
3. `docker compose up -d --build`. caddy가 새 도메인으로 Let's Encrypt 인증서를 자동으로 다시 받는다 — Caddyfile이나 코드 변경 전혀 없음.
4. 기존 GCP의 데이터를 유지하고 싶다면 이전에 DB 덤프/복원:
   ```sh
   # GCP에서
   docker compose exec postgres pg_dump -U halfface halfface_lab > dump.sql
   scp dump.sql gabia-server:~/app/
   # Gabia에서 (docker compose up으로 postgres가 뜬 뒤)
   docker compose exec -T postgres psql -U halfface halfface_lab < dump.sql
   ```
   테스트/임시 목적이라 데이터를 새로 시작해도 무방하다면 이 단계는 생략해도 된다.
5. GCP VM 삭제 (5번 참고).
