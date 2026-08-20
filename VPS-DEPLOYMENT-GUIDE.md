# Taxpropath — VPS Deployment Guide (Hostinger KVM2)

Ye file un sabhi commands ka record hai jo humne VPS pe chalaye hain, har command ka
matlab Hinglish mein samjhaya gaya hai. Jaise-jaise deployment aage badhega, is file
mein naye steps add hote rahenge.

## Server Info

| Cheez | Value |
|---|---|
| Hostname | `srv1910445` |
| OS | Ubuntu 24.04.4 LTS (noble) |
| CPU | 2 cores |
| RAM | 7.8 GB |
| Disk | 96 GB (root `/`) |
| Provider | Hostinger — KVM2 VPS |

## Plan (overview)

1. ~~System check (OS, CPU, RAM, disk)~~ ✅
2. ~~Swap space banana~~ ✅
3. System update (in progress)
4. Docker install
5. Firewall (ufw) setup
6. Self-hosted Supabase (Docker Compose)
7. Next.js app deploy (build + run)
8. Nginx reverse proxy setup
9. Poora VPS IP se test karna (login, checkout, admin)
10. Sab sahi hone ke baad — `taxpropath.com` ka DNS naye VPS pe point karna
11. SSL (Certbot) domain ke liye

---

## Step 1 — System Check

Pehle VPS ki basic capacity check ki, taaki pata chale Docker + self-hosted Supabase +
Next.js teeno chalane layak resources hain ya nahi.

```bash
lsb_release -a
```
**Matlab**: OS ka naam aur version dikhata hai. Result: Ubuntu 24.04.4 LTS.

```bash
nproc
```
**Matlab**: System mein kitne CPU cores hain, wo batata hai. Result: 2 cores.

```bash
free -h
```
**Matlab**: RAM ka status — total, kitni use ho rahi hai, kitni free hai.
`-h` = human-readable (GB/MB mein, raw bytes mein nahi). Result: 7.8Gi total, 6.5Gi free.

```bash
df -h /
```
**Matlab**: Disk storage ka status root partition (`/`) ka — jahan Docker images,
database data, aur app files store honge. Result: 96G total, 95G free.

**Nateeja**: 2 vCPU / 8GB RAM / 96GB disk — self-hosted Supabase + Next.js dono
comfortably chal sakte hain isme.

---

## Step 2 — Swap Space Banana

Swap ek safety net hai: agar kabhi RAM full ho jaye (Docker build ya heavy database
query ke time), toh system crash hone ke bajaye disk ke ek hisse ko temporarily RAM
jaisa use kar leta hai. Pehle `free -h` mein Swap `0B` tha, isliye 2GB swap banaya.

```bash
sudo fallocate -l 2G /swapfile
```
**Matlab**: Disk pe ek khaali 2GB ki file turant bana deta hai (`/swapfile` naam se) —
yahi file baad mein swap ke roop mein use hogi. `-l 2G` = size 2 gigabyte.

```bash
sudo chmod 600 /swapfile
```
**Matlab**: File ki permissions set karta hai taaki sirf `root` isse read/write kar
sake. Zaroori hai kyunki swap file mein temporarily system ki RAM ka data copy hota
hai, jo sensitive ho sakta hai.

```bash
sudo mkswap /swapfile
```
**Matlab**: Us file ke andar swap filesystem likh deta hai (formatting jaisa) — ab
Linux ko pata chal jata hai ki ye file swap ke roop mein use ho sakti hai.

```bash
sudo swapon /swapfile
```
**Matlab**: Formatted swap file ko turant activate/live kar deta hai — system ab isse
extra RAM backup ki tarah use karna shuru kar deta hai.

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```
**Matlab**: `/etc/fstab` file mein ek line add karta hai jo Linux ko batati hai ki har
reboot ke baad `/swapfile` ko automatically swap ki tarah on kar de. Isके bina, VPS
reboot hone pe swap gayab ho jata (dobara manually activate karna padta).
`tee -a` = is output ko file ke end mein append (jodo) karo.

**Verify kiya**:
```bash
free -h
```
Result: `Swap: 2.0Gi total, 0B used, 2.0Gi free` — swap ab permanent aur active hai.

---

## Step 3 — System Update (in progress)

```bash
sudo apt update
```
**Word by word matlab**:
- `sudo` = "superuser do" — command ko **admin/root permission** ke saath chalao (isliye
  password maangta hai).
- `apt` = Ubuntu ka **package manager** — software install/remove/update karne ka tool
  (Play Store jaisa, but Ubuntu ke liye).
- `update` = Sirf apt ka **catalog/list refresh** karta hai (kaunse software ki nayi
  version aayi hai) — khud kuch install/upgrade NAHI karta.

**Result**: `7 packages can be upgraded` — matlab 7 software purane version pe hain,
inhe upgrade karna baaki hai.

```bash
sudo apt upgrade -y
```
**Matlab**: Ab actually un 7 (ya jitne bhi) packages ko **nayi version pe install**
karta hai. `-y` flag matlab har confirmation prompt ("Do you want to continue? [Y/n]")
pe khud hi "yes" bol deta hai, taaki beech mein rukna na pade.

**Result**: Upgrade ke saath ek **naya kernel** (`6.8.0-138-generic`) bhi install hua.
Kernel OS ka core engine hai jo boot ke time ek baar RAM mein load hota hai aur tab tak
wahi chalta hai jab tak reboot na ho — chahe disk pe naya version aa bhi jaye. Isliye
naye kernel ko **activate** karne ke liye reboot zaroori tha.

```bash
sudo reboot
```
**Matlab**: VPS restart karta hai taaki naya kernel load ho jaye. SSH connection turant
disconnect ho jata hai (normal hai) — ~30-60 sec baad dobara `ssh root@<VPS-IP>` se
connect kiya.

**Verify kiya reboot ke baad**:
```bash
uname -r
```
**Matlab**: Kernel ka current running version dikhata hai. Result: `6.8.0-138-generic`
— matlab naya kernel successfully load ho gaya. ✅

---

## Step 4 — Docker Check (install skip ho gaya)

Docker install karne se pehle check kiya ki VPS template mein pehle se toh nahi hai:

```bash
docker --version
```
**Result**: `Docker version 29.7.2` — **pehle se installed tha**, install step skip.

```bash
docker compose version
```
**Matlab**: Docker Compose ek plugin hai jo `docker-compose.yml` file padh ke
**multiple containers ek saath** manage karta hai (self-hosted Supabase isी se chalega,
kyunki usme 10-12 alag containers hote hain). **Result**: `v5.5.0` — ye bhi ready hai.

---

## Step 5 — Firewall (UFW) Setup

`ufw` (Uncomplicated Firewall) Ubuntu ka built-in firewall hai — control karta hai
kaunse **ports** bahar se access ho sakte hain. Pehle check kiya:

```bash
sudo ufw status
```
**Result**: `inactive` — matlab abhi firewall band tha, saare ports open the.

Enable karne se **pehle** zaroori ports allow kiye (order important hai — SSH allow
kiye bina enable karte toh khud lock out ho jaate VPS se):

```bash
sudo ufw allow OpenSSH
```
**Matlab**: Port **22** (SSH) allow karta hai — isी se hum VPS mein login karte hain.
Sabse pehle ye allow karna zaroori hai warna firewall on karte hi khud ka access chala
jata.

```bash
sudo ufw allow 80/tcp
```
**Matlab**: Port **80** allow karta hai — normal website traffic (**HTTP**, bina SSL)
isी pe aata hai.

```bash
sudo ufw allow 443/tcp
```
**Matlab**: Port **443** allow karta hai — secure website traffic (**HTTPS**, SSL
laगने ke baad) isی pe aata hai. Abhi domain/SSL nahi hai, future ke liye pehले hi
allow kar diya.

```bash
sudo ufw enable
```
**Matlab**: Firewall ko **activate** karta hai. Enable hote hi sirf allow kiye hue
ports (22, 80, 443) khule rahenge, baaki sab **block** ho jayega bahar se. Confirmation
prompt aaya tha ("may disrupt ssh connections") — `y` type kiya, connection nahi
tootа kyunki SSH pehle hi allow tha.

**Verify kiya**:
```bash
sudo ufw status
```
**Result**: `OpenSSH`, `80/tcp`, `443/tcp` — sab `ALLOW` dikh rahe hain (IPv4 aur IPv6
dono ke liye). ✅ Firewall setup complete.

---

## Step 6 — Self-hosted Supabase Setup (in progress)

### Git check aur Supabase code download

```bash
git --version
```
**Matlab**: Git ek tool hai jisse GitHub jaisi jagah se code repositories download/manage
kiye jaate hain. **Result**: `git version 2.43.0` — pehle se installed tha.

```bash
git clone --depth 1 https://github.com/supabase/supabase
```
**Matlab**:
- `git clone` = GitHub se ek poora project VPS pe copy/download karna.
- `https://github.com/supabase/supabase` = Supabase ka **official repo**, isme unka
  ready-made self-hosting Docker setup hai.
- `--depth 1` = Sirf latest version download karo, poori commit history nahi — fast
  aur kam disk space.

**Result**: ~580 MB download hua, successfully complete.

```bash
cd supabase/docker
```
**Matlab**: Downloaded repo ke andar ek `docker` folder hai jisme self-hosting ke liye
**ready-made `docker-compose.yml` aur config files** hain — usी mein navigate kiya.

```bash
ls
```
**Matlab**: Current folder ki files list karta hai. `docker-compose.yml` dikha, lekin
`.env.example` (jisme config template hota hai) nahi dikha.

```bash
ls -a
```
**Matlab**: `-a` = "all" — **hidden files bhi dikhao** (jo `.` se start hoti hain,
jaise `.env.example`). Normal `ls` hidden files skip kar deta hai. Isse
`.env.example` mil gayi.

### `.env` file banana aur samajhna

```bash
cp .env.example .env
```
**Matlab**: `.env.example` ek **template** hai — usmein directly edit nahi karte.
`cp` (copy) se uski ek duplicate `.env` naam se banai — yahi asli file hai jise Docker
actually padhega. Hum ab isme apne real passwords/secrets/settings daalenge.

**`cat` vs `nano`**: `cat .env` sirf file ka content **print** karta hai (read-only),
`nano .env` file ko **editor mein kholta hai** (dekh + edit dono). File dekhne ke liye
`cat .env` use kiya.

### `.env` file ke sections (samjha)

| Section | Kya hai | Kya karna hai |
|---|---|---|
| **Secrets** (`POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, etc.) | Passwords/keys jo services ek-dusre se secure baat karne ke liye use karte hain | Abhi placeholder hain (`your-super-secret...`) — insecure, **badalna zaroori** |
| **URLs** (`SUPABASE_PUBLIC_URL`, `API_EXTERNAL_URL`) | Supabase khud ko kahan "host" samjhe | Abhi `localhost` — VPS IP pe update karna hoga |
| **Database (Postgres)** | Internal DB config | Default theek hai |
| **Studio Dashboard login** (`DASHBOARD_USERNAME`/`PASSWORD`) | Supabase ka admin panel login | Weak default — badalna zaroori |
| **Auth / SMTP** | Login system + emails (password reset, confirmation) | `SITE_URL` ko apni Next.js app ke URL pe set karna. SMTP abhi fake hai — real service baad mein chahiye |
| **API Gateway (Kong)**, port `8000` | Ek hi "darwaza" jahan se Studio dashboard aur Database API dono milte hain | Koi change nahi. Humara Next.js app port `3000` pe chalega — **koi port conflict nahi** |
| OAuth / SAML / SMS / S3 / OpenAI / Caddy-Nginx | Optional advanced features | **Skip** — zarurat nahi, Nginx khud alag se set karenge baad mein |

**Good news**: File khud bataती hai secrets manually banane ki zarurat nahi — ek ready
script hai jo random secrets auto-generate karke `.env` mein daal dega:

```bash
sh utils/generate-keys.sh
```
**Matlab**: Official Supabase script — saare zaroori random passwords/keys khud
generate karke `.env` file mein daal dega (jaise `POSTGRES_PASSWORD`, `JWT_SECRET`,
`SECRET_KEY_BASE`, etc.) — manually har ek ke liye `openssl` command chalane ki zarurat
nahi. Chalane ke baad ek prompt aaya `Update .env file? (y/N)` — **`y`** diya, isse
script ne generate kiye hue values seedha `.env` mein likh diye.

**Generate hui** (in sab ko safe rakhna, kabhi publicly share na karna): `JWT_SECRET`,
`ANON_KEY`, `SERVICE_ROLE_KEY` (legacy keys), `POSTGRES_PASSWORD`, `DASHBOARD_PASSWORD`,
`SECRET_KEY_BASE`, encryption keys, Logflare/S3/MinIO keys.

```bash
sh utils/add-new-auth-keys.sh
```
**Matlab**: Pehli script ne **purani style** (HS256) ki keys banayi thi. Ye script
**naye, zyada secure format** (ES256) ki keys generate karti hai —
`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `JWT_KEYS`, `JWT_JWKS` waghera.
Yahan bhi `y` deke `.env` update kiya.

### VPS ki public IP nikalna aur URLs update karna

```bash
curl -4 ifconfig.me
```
**Matlab**: `ifconfig.me` ek service hai jo request karne wale ka **public IP address**
wapas bata deti hai. `-4` = IPv4 address chahiye. **Result**: `187.127.215.209` — yahi
humari VPS ki internet-facing IP hai.

Ab `.env` ke andar teen URLs jo abhi `localhost` pe the, unhe is IP pe point kiya
(taaki testing ke waqt bahar se — apne browser se — access ho sake):

```bash
sed -i 's|^SITE_URL=.*|SITE_URL=http://187.127.215.209:3000|' .env
```
**Matlab**: `sed -i` ek command hai jo file ke andar text **dhoondh ke replace** kar
deti hai, seedha file mein save karke (nano kholne se fast hai chhote changes ke liye).
`SITE_URL` humari **Next.js app ka address** hai — Supabase Auth isko login/signup
confirmation links banane ke liye use karta hai. Port `3000` = jahan Next.js baad mein
chalegi.

```bash
sed -i 's|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=http://187.127.215.209:8000|' .env
```
**Matlab**: `SUPABASE_PUBLIC_URL` batata hai Supabase ka **Studio dashboard + API
gateway** kis address pe milega. Port `8000` = Kong API gateway ka port.

```bash
sed -i 's|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=http://187.127.215.209:8000/auth/v1|' .env
```
**Matlab**: Specifically **Auth service** (login/signup) ka external address —
password reset/OAuth callback links isی ko use karke bante hain.

```bash
sed -i 's|^POOLER_TENANT_ID=.*|POOLER_TENANT_ID=taxpropath|' .env
```
**Matlab**: Supavisor (database connection pooler) ko har project ke liye ek **unique
naam/ID** chahiye hota hai. Placeholder `your-tenant-id` tha, humne `taxpropath` set
kiya.

```bash
sed -i 's|^ENABLE_EMAIL_AUTOCONFIRM=.*|ENABLE_EMAIL_AUTOCONFIRM=true|' .env
```
**Matlab**: Normally signup ke baad ek confirmation email jata hai, link click karne
ke baad hi account active hota hai. Abhi real SMTP (email bhejne ki service) configure
nahi hai (fake placeholder values hain) — isliye **testing ke liye temporarily**
`true` kar diya, taaki signup turant confirm ho jaye bina email ke.

⚠️ **REMINDER — production/domain pe jaane se pehle zaroor karna**: Ise wapas `false`
karna hoga aur `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` mein **real email service**
(jaise Brevo, SendGrid) daalni hogi — warna koi bhi fake email se signup kar sakta hai.

*(Baaki fields — `DASHBOARD_USERNAME`, SMTP — is section mein aage update honge.)*

### Firewall mein Supabase port kholna

```bash
sudo ufw allow 8000/tcp
```
**Matlab**: Supabase Studio dashboard + API gateway port `8000` pe hain — firewall mein
ye port allow kiya taaki browser se access ho sake.

### Supabase containers start karna 🎉

```bash
docker compose up -d
```
**Matlab**: `docker-compose.yml` + `.env` padh ke usme define ~12 containers (Database,
Auth, REST API, Realtime, Storage, API gateway, Studio dashboard, etc.) ek saath start
karta hai. `-d` = background mein chalega (detached mode).

```bash
docker compose ps
```
**Matlab**: Is project ke saare containers ka status list karta hai. **Result**: 11
containers, sab `Up`/`healthy` — Supabase stack successfully chal gaya. (Ye version
"Envoy" gateway use karta hai purane "Kong" ki jagah — kaam wahi hai, port `8000`.)

### ⚠️ Security fix — Database internet pe expose ho rahi thi

VPS ki bahar se test kiya (`/dev/tcp` se raw connection try karke) toh pata chala ki
port **5432 (raw Postgres)** aur **6543 (pooler)** — jo humne kabhi `ufw allow` nahi
kiya tha — phir bhi internet se **reachable** the.

**Wajah**: Docker jab kisi container ka port "publish" karta hai, wo apne khud ke
`iptables` rules seedhe daal deta hai jo **UFW ke rules ko bypass** kar dete hain. UFW
ne "deny" bola but Docker ne apni taraf se already "allow" kar diya tha — ye ek
well-known Docker + UFW gotcha hai.

**Risk**: Poora database (jisme baad mein saara user/order data store hoga) sirf
password ke bharose internet pe open tha — bina zaroorat ke extra attack surface.

**Fix**: `docker-compose.yml` mein dhoondha (line 537-538, Supavisor/pooler service ke
andar):
```bash
grep -n "5432\|6543" docker-compose.yml
```
Mila:
```
- ${POSTGRES_PORT}:5432
- ${POOLER_PROXY_PORT_TRANSACTION}:6543
```
IP specify na hone se Docker default `0.0.0.0` (sabke liye khula) pe bind karta hai.
`127.0.0.1` (sirf isi VPS ke andar se) explicitly add kiya:

```bash
sed -i 's|- \${POSTGRES_PORT}:5432|- 127.0.0.1:${POSTGRES_PORT}:5432|' docker-compose.yml
sed -i 's|- \${POOLER_PROXY_PORT_TRANSACTION}:6543|- 127.0.0.1:${POOLER_PROXY_PORT_TRANSACTION}:6543|' docker-compose.yml
```
Humari Next.js app (isی VPS pe chalegi) ab bhi `localhost` ke through database se
connect kar payegi, lekin bahar se koi direct access nahi kar sakta.

Change **apply** karne ke liye dobara:
```bash
docker compose up -d
```
**Matlab**: Docker Compose compare karta hai config mein kya badla — sirf jis
container ka config change hua (yahan `supavisor`/pooler), **usी ko restart** karta
hai, baaki containers untouched rehte hain.

**Verify kiya** (bahar se test karke): Port `8000` reachable ✅, ports `5432` aur
`6543` ab **NOT reachable** ✅ — fix confirmed working.

### Studio Dashboard access

Browser mein `http://187.127.215.209:8000` khol ke `DASHBOARD_USERNAME`/
`DASHBOARD_PASSWORD` (`.env` mein `grep DASHBOARD .env` se mile) se login kiya —
Studio dashboard successfully accessible tha. ✅

### Database schema — 6 migrations chalayi (Studio → SQL Editor)

Taxpropath project mein pehle se 6 ready-made SQL migration files thi
(`supabase/migrations/` folder). Studio ke **SQL Editor** mein ek-ek karke, order mein
paste + Run kiya:

1. **`0001_init.sql`** — Main schema: `presenters`, `webinars`, `pricing_options`,
   `profiles`, `orders`, `order_items`, `contact_messages` tables + RLS (row level
   security) policies.
2. **`0002_order_items_static_catalog.sql`** — `order_items` ke `webinar_id`/
   `pricing_option_id` columns ko UUID se **text** mein badla (catalog abhi bhi code
   ke andar static data hai, database table mein nahi).
3. **`0003_place_order_rpc.sql`** — `place_order()` function banaya jo checkout ke
   time order + order_items ko ek saath, safely insert karta hai. Sirf server-side
   se hi callable hai (security ke liye).
4. **`0004_paypal.sql`** — Orders table mein PayPal ke columns add kiye, aur
   `mark_order_paid()` function banaya jo payment amount verify karke order ko
   "paid" mark karta hai.
5. **`0005_admin.sql`** — Admin role system (`is_admin()` function), webinar video
   fields, admin-only RLS policies, aur private video storage bucket.
6. **`0006_site_content.sql`** — Admin-editable content tables (banners, categories,
   industries, brands, testimonials) + starting seed data.

**Result**: Saari 6 migrations successfully run hui, koi error nahi. Database ab
poori tarah ready hai. ✅

---

## Step 7 — Next.js App Deploy (in progress)

### Code VPS pe le jana

Local machine (Windows) pe project ka ek **compressed archive** banaya, `node_modules`
aur `.next` (build files) ke bina — taaki chhota aur fast rahe (VPS pe fresh install
karenge):

```bash
tar --exclude='node_modules' --exclude='.next' --exclude='out' --exclude='.git' -czf taxpropath-app.tar.gz .
```
**Matlab**: `tar` files ko ek single compressed file mein pack karta hai. `--exclude`
se bataya kaunse folders skip karne hain. Result: sirf 318 KB ki file (chhoti, kyunki
sirf source code hai, dependencies nahi).

Isko VPS pe transfer kiya — **naye PowerShell window** se (VPS wale SSH session se
nahi, kyunki ye **upload command hai apni Windows machine se**):

```powershell
scp D:\newtaxpropath\taxpropath-app.tar.gz root@187.127.215.209:~/
```
**Matlab**: `scp` (secure copy) — file ko securely ek computer se doosre pe bhejta
hai. VPS ka root password maanga, dala, transfer ho gaya.

VPS ke SSH session mein wapas jaake extract kiya:

```bash
mkdir -p ~/taxpropath-app && tar -xzf taxpropath-app.tar.gz -C ~/taxpropath-app
cd taxpropath-app
```
**Matlab**: Ek naya folder banaya aur usme zip extract kar di (`-x` = extract, `-z` =
gzip compressed, `-f` = filename).

### `.env.local` banana (Supabase se connect karne ke liye)

```bash
cd ~/taxpropath-app
ANON_KEY=$(grep '^ANON_KEY=' ~/supabase/docker/.env | cut -d '=' -f2-)
SERVICE_ROLE_KEY=$(grep '^SERVICE_ROLE_KEY=' ~/supabase/docker/.env | cut -d '=' -f2-)

cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=http://187.127.215.209:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
EOF
```
**Matlab**: Supabase ke `.env` file mein se `ANON_KEY` aur `SERVICE_ROLE_KEY` ki
values nikal ke (bina screen pe dikhaye) ek naye `.env.local` file mein likh di —
yahi file Next.js app padhega apna Supabase connection banane ke liye.
`SERVICE_ROLE_KEY` sabse powerful/sensitive key hai (saari security bypass karti
hai) — isliye sirf server-side code mein use hoti hai, kabhi browser mein nahi jaati.

PayPal (payments) abhi **skip** kiya — jab real credentials milenge tab add karenge.

### Node.js install karna

```bash
npm install
```
**Result**: Error — `npm: command not found`. Matlab Node.js/npm is VPS pe installed
hi nahi tha.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```
**Matlab**: Ubuntu ka default `apt install npm` bahut purana version deta hai jo
Next.js 16 ke liye kaafi nahi. Isliye NodeSource (official third-party Node.js
repository) ka setup script chalaya — ye Ubuntu ke apt catalog ko Node.js **version
20** (stable LTS) ke liye configure kar deta hai. `sudo -E` = admin permission ke
saath, environment variables preserve karke.

```bash
sudo apt install nodejs -y
```
**Matlab**: NodeSource repository se Node.js version 20 aur `npm` install kiya.

**Verify kiya**:
```bash
node --version && npm --version
```
**Result**: `v20.20.2`, `10.8.2` — installed. ✅

```bash
npm install
```
**Result**: 382 packages install hue, lekin **warnings** aayi — Supabase ki
libraries (`@supabase/auth-js` etc.) ko **Node.js version 22+** chahiye tha, humne 20
install kiya tha. Fatal nahi tha, but production ke liye sahi version match karna
zaroori — isliye Node ko upgrade kiya.

### Node.js ko version 22 pe upgrade karna

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```
**Matlab**: Pehle wali NodeSource script jaisa hi, is baar `22.x` version ke liye —
existing Node 20 ko 22 se **replace** kar diya.

```bash
node --version && rm -rf node_modules package-lock.json && npm install
```
**Matlab**: Naya version confirm kiya (`v22.23.2`), phir purani (Node 20 ke saath
banayi) dependencies delete karke **fresh install** ki naye Node ke saath.
**Result**: 382 packages, is baar koi warning nahi, **0 vulnerabilities** (pehle 1
thi) — clean install. ✅

### Production build

```bash
npm run build
```
**Matlab**: App ka ek **optimized production version** banata hai (jo humne pehle
dev mode mein `npm run dev` se localhost pe test kiya tha, wo alag hota hai — dev mein
speed/debugging ke liye optimize hota hai, build production ke liye — chhota aur
fast). **Result**: Saare pages (home, webinars, cart, checkout, login, admin, etc.)
successfully build hue. ✅

### PM2 install karna (app hamesha chalte rehne ke liye)

```bash
sudo npm install -g pm2
```
**Matlab**: Agar sirf `npm run start` chalate, SSH band karte hi app bhi ruk jati.
**PM2** ek process manager hai jo Node.js app ko background mein hamesha chalne deta
hai, crash hone pe auto-restart karta hai, aur server reboot ke baad bhi wapas start
ho sakta hai. `-g` = system-wide globally install.

### App start karna (PM2)

```bash
pm2 start npm --name taxpropath -- start
```
**Matlab**: PM2 ko `npm start` (jo `next start` chalata hai, production build serve
karta hai) manage karne ke liye bola. `--name taxpropath` = pehchaan ke liye naam.
**Result**: Status `online` — app successfully chal gayi. ✅

```bash
sudo ufw allow 3000/tcp
```
**Matlab**: Firewall mein port `3000` allow kiya (jahan Next.js app chal rahi hai)
taaki browser se test ho sake. Browser mein `http://187.127.215.209:3000` khola —
**website successfully load hui** ✅

### PM2 ko permanent banana (VPS reboot survive kare)

```bash
pm2 save
```
**Matlab**: Abhi chal rahe processes (`taxpropath`) ki list save kar deta hai.

```bash
pm2 startup
```
**Matlab**: PM2 ko Linux ke systemd (startup services system) mein register karta
hai — VPS reboot hone pe Linux khud PM2 ko start karega, aur PM2 apni saved list se
`taxpropath` app wapas start kar degi. (Naye PM2 version ne khud hi zaroori systemd
command chala di, manually copy-paste nahi karna pada.)

---

## Step 8 — Nginx Reverse Proxy

Abhi tak site sirf `http://IP:3000` pe accessible thi. Real domain pe log bina port
number ke (`taxpropath.com`) access karenge — iske liye **Nginx** chahiye jo port 80
(aur baad mein 443/HTTPS) ki requests ko andar se port 3000 tak forward kare.

```bash
sudo apt install nginx -y
```
**Matlab**: Nginx (web server/reverse proxy) install kiya.

```bash
sudo tee /etc/nginx/sites-available/taxpropath > /dev/null <<'EOF'
server {
    listen 80;
    server_name 187.127.215.209 taxpropath.com www.taxpropath.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```
**Matlab**: Ek config file banayi jo bolti hai — "port 80 pe jo bhi aaye (IP se ya
domain se), use `localhost:3000` (Next.js app) tak forward kar do". `proxy_set_header`
lines app ko visitor ki real IP, domain, aur protocol (http/https) ki info deती hain.

```bash
sudo ln -s /etc/nginx/sites-available/taxpropath /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```
**Matlab**: Config ko `sites-enabled` mein **symbolic link** (shortcut) karke activate
kiya — Nginx sirf isi folder ki configs use karta hai. Purani default demo page
config hata di taaki conflict na ho.

```bash
sudo nginx -t
```
**Matlab**: Config file ka syntax check kiya bina apply kiye. **Result**: "syntax is
ok", "test is successful" ✅

```bash
sudo systemctl reload nginx
```
**Matlab**: Nginx ko naya config **dobara padhne** ko bola (bina poora restart kiye).

**Result**: Browser mein `http://187.127.215.209` (bina `:3000` ke) khola —
**successfully load hua** ✅ Nginx reverse proxy working.

---

## Step 9 — Domain DNS Switch

Hostinger **hPanel** → Domains → `taxpropath.com` → **DNS Zone Editor** mein jaake:

1. Existing **A record** (`Type: A, Name: @`) dhoondha jo purani hosting IP
   (`92.112.189.196`) pe point kar raha tha.
2. Uski **Value** ko naye VPS IP (`187.127.215.209`) se **Update** kiya.
3. `www` pehle se hi ek `CNAME` ke through `@` ko follow kar raha tha, isliye alag se
   badalne ki zarurat nahi padi.

**Result**: `nslookup` se confirm kiya — DNS ne naya IP dikhana shuru kar diya
(Google/Cloudflare DNS pe turant, kuch resolvers pe thoda time lagा — normal
propagation behavior).

### 🐛 Troubleshooting — site load nahi ho rahi thi (poori kahani)

Domain switch ke baad browser mein `ERR_CONNECTION_TIMED_OUT` aa raha tha (laptop
aur mobile dono pe). Do alag-alag issues nikle, dono fix kiye:

**Issue 1 — Purana AAAA (IPv6) record**: `nslookup` mein dikha ki domain ke against
ek **IPv6 address bhi tha** jo **purani hosting** ka tha (humne sirf IPv4 "A" record
badla tha, "AAAA" record chhoda hua tha). VPS IPv6 support nahi karta, isliye is
purane AAAA record ko DNS Zone Editor se **delete** kiya — ab sirf IPv4 route bacha,
koi confusion nahi.

**Issue 2 — Port 443 (HTTPS) par kuch respond nahi kar raha tha**: AAAA delete karne
ke baad bhi timeout continue hua. Diagnose kiya (`time` command se precise timing
check karke):
```bash
# Port 80: 0.4 second mein respond
# Port 443: poora 8 second timeout, koi response nahi (silent hang)
```
**Wajah**: Modern browsers (Chrome/mobile) jab sirf `taxpropath.com` type karte ho
(bina `http://` ke), **pehle HTTPS (port 443) try karte hain**. Humne abhi tak SSL
set up nahi kiya tha, isliye port 443 pe **koi service sun hi nahi rahi thi** — is
VPS ki cloud networking setup mein bina-listener wale port pe request turant
"refuse" hone ke bajaye **silently drop** ho rahi thi, jisse browser bahut der
HTTPS pe atka reh ke hi HTTP pe fallback karta (agar karta bhi).

Hostinger ke **VPS → Security → Firewall** (ye ek **alag, infrastructure-level
firewall hai** — humare `ufw` se upar/bahar) mein check kiya ki port 443 allow hai ya
nahi — waha `Accept TCP 443` rule already thi, matlab wo blocker nahi tha. Asli fix:
**SSL laga do taaki port 443 pe genuinely koi service respond kare** — jo waise bhi
plan mein tha.

---

## Step 10 — SSL Certificate (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx -y
```
**Matlab**: **Certbot** — Let's Encrypt ka free SSL certificate tool. `python3-certbot-nginx`
plugin isse Nginx ke saath directly kaam karne deta hai (config khud edit kar deta
hai). Auto-renewal ke liye ek systemd timer bhi khud install ho gaya.

```bash
sudo certbot --nginx -d taxpropath.com -d www.taxpropath.com
```
**Matlab**: `taxpropath.com` aur `www.taxpropath.com` dono ke liye ek free SSL
certificate request/issue/install karta hai, Nginx config khud modify karke.
Poochta hai: email address (renewal notices ke liye), Terms of Service agree (Y),
EFF ke saath email share (optional, Y/N).

**Result**: ✅ Certificate successfully issue aur deploy hua dono domains ke liye.
Expiry: 16 Nov 2026 (Certbot **automatically renew** karega background mein, kuch
karne ki zarurat nahi). HTTPS ab enabled hai:
`https://taxpropath.com` aur `https://www.taxpropath.com`

**Final verification**: Laptop aur mobile dono ke browser mein `https://taxpropath.com`
test kiya — **poori tarah successfully load ho gayi**, lock 🔒 icon ke saath. ✅

**🎉 Milestone: taxpropath.com ab live hai naye VPS pe, HTTPS ke saath, self-hosted
Supabase backend ke saath.**

---

## Step 11 — Supabase ko bhi HTTPS pe lana (Mixed Content fix)

**Problem**: App ka `NEXT_PUBLIC_SUPABASE_URL` abhi `http://187.127.215.209:8000`
(plain HTTP) tha, lekin website ab HTTPS pe hai. Browser **"Mixed Content"** security
rule follow karta hai — HTTPS page se HTTP data request **block** kar deta hai.
Matlab login/signup/checkout (jo Supabase call karte hain) fail ho jate.

**Fix**: Supabase ke liye ek subdomain (`api.taxpropath.com`) banaya, usko bhi
Nginx + SSL de diya — bilkul jaise main domain ko diya tha.

### DNS + Nginx + SSL, `api.taxpropath.com` ke liye

Hostinger DNS Zone Editor mein naya record add kiya:
- Type: `A`, Name: `api`, Value: `187.127.215.209`

```bash
sudo tee /etc/nginx/sites-available/api-taxpropath > /dev/null <<'EOF'
server {
    listen 80;
    server_name api.taxpropath.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/api-taxpropath /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```
**Matlab**: Bilkul `taxpropath.com` wale config jaisa hi, bas `api.taxpropath.com`
pe aane wali requests ko `localhost:8000` (Supabase) tak forward karta hai.

```bash
sudo certbot --nginx -d api.taxpropath.com
```
**Result**: SSL certificate mila aur deploy hua. `https://api.taxpropath.com` test
kiya — `401 Unauthorized` mila, jo **sahi/expected hai** (bina API key/login ke
seedha `/` access karne pe security ki wajah se, Nginx→Supabase connection sahi
kaam kar raha hai ye confirm karta hai).

### URLs update karna aur rebuild

Supabase ke `.env` mein:
```bash
cd ~/supabase/docker
sed -i 's|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=https://api.taxpropath.com|' .env
sed -i 's|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=https://api.taxpropath.com/auth/v1|' .env
docker compose up -d
```

Next.js app ke `.env.local` mein:
```bash
cd ~/taxpropath-app
sed -i 's|^NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=https://api.taxpropath.com|' .env.local
```

**Rebuild zaroori tha**: `NEXT_PUBLIC_` wali settings Next.js build ke time
JavaScript ke andar permanently "bake" ho jaati hain — sirf `.env.local` change
karne se browser mein asar nahi hota, dobara build chahiye:
```bash
npm run build
pm2 restart all
```
**Result**: Build + restart successful. ✅

**Final test**: `https://taxpropath.com/register` pe signup try kiya — **successfully
ho gaya**! Matlab poora chain (browser → Next.js app → HTTPS → `api.taxpropath.com`
→ Supabase Auth → Database) end-to-end kaam kar raha hai. ✅

**🎉🎉 Deployment complete**: taxpropath.com poori tarah live hai — apna VPS, apna
self-hosted Supabase, HTTPS ke saath, login/signup working.

---

## Baaki bacha hua (optional / baad mein karna)

Ye cheezein abhi **blocking nahi hain** (site kaam kar rahi hai), lekin real
customers ke liye live jaane se pehle dhyan dena:

1. **Email confirmation**: `ENABLE_EMAIL_AUTOCONFIRM=true` abhi bhi ON hai (testing
   ke liye kiya tha) — isse koi bhi fake/galat email se signup kar sakta hai. Real
   SMTP service (Brevo, SendGrid, etc.) laga ke ise `false` karna hoga.
2. **PayPal**: Abhi configure nahi kiya — jab real PayPal credentials milein,
   `.env.local` mein `PAYPAL_MODE`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` add
   karke rebuild karna hoga.
3. **Admin user banana**: Abhi koi bhi user admin panel access nahi kar sakta.
   Supabase Studio → SQL Editor mein apne user ko admin banane ke liye:
   `update profiles set role = 'admin' where id = '<tumhara-user-uuid>';`
4. **Backups**: Database aur `.env` files ka koi backup strategy abhi set nahi hai.
5. **Purani Hostinger shared hosting**: Ab domain se disconnect hai — chaho toh
   baad mein us hosting plan ko cancel/downgrade kar sakte ho (paisa bachega),
   agar wahan aur kuch use nahi ho raha.

---

## 🐛 Incident Log — VPS unreachable + DNS revert (baad mein hua)

Kuch waqt baad site achanak **unreachable** ho gayi thi (SSH, HTTP, HTTPS — sab
timeout, VPS panel mein "Running" dikhne ke bawajood). Do alag issues nikle:

**Issue 1 — Connecting IP block ho gayi thi**: Hostinger ke security system ne
tumhari (connecting) IP ko **automatically block** kar diya tha — bahut saare
SSH/connection attempts "scanning-like activity" jaisa lage the (isi session mein
humne bahut saari testing ki thi). VPS khud kabhi down nahi hua tha. **Fix**:
Hostinger support se contact kiya, unhone IP ka block **remove** kar diya.
**Sujhaya gaya (future ke liye)**: SSH key-based login use karo (password ke
bajaye), root password-login disable karo, SSH ko trusted IP tak restrict karo.

**Issue 2 — DNS `A @` record revert ho gaya tha**: Jab VPS "unreachable" laga, kisi
automated Hostinger system ne domain ko wapas unki **apni CDN/hosting** se
"reconnect" kar diya — humara `A @ → 187.127.215.209` record gayab hoke uski jagah
`ALIAS @ → taxpropath.com.cdn.hstgr.net` aa gaya tha (aur `www` bhi CDN pe point
ho gaya tha). Isliye purani website wapas dikhne lagi thi. **Fix**: Wapas DNS Zone
Editor mein jaake ALIAS record delete kiya, `A @ → 187.127.215.209` dobara add
kiya, aur `www` CNAME ko wapas `taxpropath.com` pe kiya.

**⚠️ Isse seekh**: Agar kabhi future mein site achanak "purani website" dikhane
lage, sabse pehle DNS Zone Editor check karo — ho sakta hai `@` record phir se
revert ho gaya ho.

---

*(Is file mein aage ke steps — Docker install, Supabase setup, Next.js deploy, Nginx,
aur domain switch — add hote rahenge jaise-jaise deployment aage badhega.)*
