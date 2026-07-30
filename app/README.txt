BELTPRO PWA PACKAGE

Files:
- index.html: mobile home screen with only four main categories
- spiral-systems.html
- baking-ovens.html
- belts.html
- conveyors.html
- styles.css
- app.js
- manifest.json
- service-worker.js
- icons/icon-192.png
- icons/icon-512.png

INSTALLATION ON GITHUB PAGES
1. Upload all files and the icons folder to the same folder in your GitHub repository.
2. The safest initial location is a folder named /app/.
3. Access it using: https://www.beltpro.com.br/app/
4. Do not open the files directly from the Windows file system. Service workers require HTTPS or localhost.
5. Update calculator href filenames if any of your existing calculator file names are different.
6. The service worker caches the app navigation. Calculations that depend on the Render Flask API still require internet access.

IMPORTANT
The HTML calculator links are based on the expected filenames. Check each against the actual filenames in your repository before publishing.
