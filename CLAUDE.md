<!-- dev-server:begin -->
## Where this project lives and how it ships

- **Work here:** `dev-vps:/home/dev/projects/flighttracker` (VS Code, Remote-SSH, host `dev-vps`). The old copy in `E:\AIProjects\flighttracker` on the PC is retired: pushing from it is blocked.
- **Production:** runs on the dev server itself (135.125.1.93), user `apps`, `/var/www/flighttracker`, pm2 `flighttracker-web`, https://flights.travelbiuro.com; pm2 `flighttracker-web` and `flighttracker-worker` (polls flights); pm2 definitions in /home/apps/ecosystem, nightly backup /var/backups/apps. Moved off the production box on 2026-10-04 (low traffic). Never edit `/var/www` there by hand; change this copy and deploy.
- **Deploy:** commit on `main` (stage by path), then `deploy flighttracker`. It pushes to the git repo on the apps account on this server (`/home/apps/git/flighttracker.git`) and runs there: `git pull origin main && npm install && npm run build && pm2 restart flighttracker-web flighttracker-worker`. It then checks pm2 and the URL. GitHub is only the nightly backup; its deploy workflow is disabled.
- Every project, its mode and status: run `projects` on the dev server.
<!-- dev-server:end -->

