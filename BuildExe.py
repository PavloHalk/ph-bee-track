import os

command = (
    'pyinstaller --noconsole --onefile '
    '--add-data "index.html;." '
    '--add-data "./css/bootstrap.min.css;." '
    '--add-data "./css/app.css;. "'
    '--add-data "favicon.ico;." '
    '--add-data ".img/logo.png;." '
    '--version-file=version.txt '
    '--icon="favicon.ico" '
    'BeeTrack.py'
)

print("🚀 Starting the build process...")
result = os.system(command)

if result == 0:
    print("\n✅ Build successful! Check the 'dist' folder.")
else:
    print("\n❌ Build failed. Check the error messages above.")