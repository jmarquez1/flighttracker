<!-- dev-server:begin -->
## Where this project lives and how it ships

- **Work here:** `dev-vps:/home/dev/projects/flighttracker` (VS Code, Remote-SSH, host `dev-vps`). The old copy in `E:\AIProjects\flighttracker` on the PC is retired: pushing from it is blocked.
- **Production:** `57.131.48.88:/var/www/flighttracker`, pm2 `flighttracker-web`, https://flights.travelbiuro.com. Never edit files there by hand; change them here and deploy.
- **Deploy:** commit on `main` (stage by path), then `deploy flighttracker`. It pushes to the git repo on production (`/home/ubuntu/git/flighttracker.git`) and runs there: `git pull origin main && npm install && npm run build && pm2 restart flighttracker-web flighttracker-worker`. It then checks pm2 and the URL. GitHub is only the nightly backup; its deploy workflow is disabled.
- Every project, its mode and status: run `projects` on the dev server.
<!-- dev-server:end -->

