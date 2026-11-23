# Weby — GitHub Pages upload

## Preview on Windows

Double-click **Preview Weby.cmd**. It opens the site in your browser using a local web server. Keep the command window open while previewing. Python 3 is required. This avoids browser restrictions on local image files and canvas animations. Close the window to stop the preview.

The two preview files are optional for hosting; GitHub Pages only needs index.html, assets/, and .nojekyll.

Upload the contents of this folder to your GitHub repository: `index.html`, `assets/`, and `.nojekyll` must be at the repository root.

In the repository Settings → Pages, select Deploy from a branch, then your main branch and / (root). Save and use the website address GitHub provides.

No build command or installation is required. All asset paths are relative, so a repository subdirectory URL works too.

Keep the assets folder together with index.html. The original design, image resolution, and animation timing are preserved. Images are extracted unchanged from the original site, with duplicates stored only once.

The inquiry form uses FormSubmit to deliver to webysrilanka@gmail.com. It needs an internet connection and the existing FormSubmit activation. Google Fonts also needs an internet connection. This package does not contain email credentials or a backend server. Test inquiries on the published HTTPS website, not by double-clicking the HTML file.
