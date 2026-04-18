import os

command = (
    'pyinstaller --noconsole --onefile '
    '--add-data "index.html;." '
    '--add-data "favicon.ico;." '
    '--add-data "css;css" '
    '--add-data "js;js" '
    '--add-data "img;img" '
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