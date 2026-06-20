import os
import json


def generate_version_file():
    """Generates version.txt (.exe metadata) from version-app.json — the single source of truth.
    Takes the latest release (releases[0]) and splits the version string into a 4-number tuple."""
    with open('version-app.json', 'r', encoding='utf-8') as f:
        latest = json.load(f)['releases'][0]

    version = latest['version']
    parts = [int(p) for p in version.split('.')]
    parts = (parts + [0, 0, 0, 0])[:4]
    vers_tuple = tuple(parts)
    year = latest['date'][:4]

    content = f'''# VSVersionInfo file — AUTO-GENERATED from version-app.json by BuildExe.py.
# Do not edit by hand; changes will be overwritten on the next build.
VSVersionInfo(
  ffi=FixedFileInfo(
    filevers={vers_tuple},
    prodvers={vers_tuple},
    mask=0x3f,
    flags=0x0,
    OS=0x40004,
    fileType=0x1,
    subtype=0x0,
    date=(0, 0)
    ),
  kids=[
    StringFileInfo(
      [
      StringTable(
        u'042204b0', # Language code (Ukrainian)
        [StringStruct(u'CompanyName', u'Pavlo Halkovsky'),
        StringStruct(u'FileDescription', u'BeeTrack'),
        StringStruct(u'FileVersion', u'{version}'),
        StringStruct(u'InternalName', u'beetrack'),
        StringStruct(u'LegalCopyright', u'Pavlo Halkovsky © {year} All rights reserved'),
        StringStruct(u'OriginalFilename', u'BeeTrack.exe'),
        StringStruct(u'ProductName', u'BeeTrack time tracker'),
        StringStruct(u'ProductVersion', u'{version}')])
      ]),
    VarFileInfo([VarStruct(u'Translation', [1058, 1200])]) # Ukrainian language code (UA)
  ]
)
'''

    with open('version.txt', 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"📝 Generated version.txt for version {version} ({latest['date']}).")


command = (
    'pyinstaller --noconsole --onefile '
    '--hidden-import "plyer.platforms.win.notification" '
    '--add-data "index.html;." '
    '--add-data "favicon.ico;." '
    '--add-data "you-are-worked-to-hard.mp3;." '
    '--add-data "version-app.json;." '
    '--add-data "css;css" '
    '--add-data "js;js" '
    '--add-data "html;html" '
    '--add-data "img;img" '
    '--add-data "lang;lang" '
    '--version-file=version.txt '
    '--icon="favicon.ico" '
    'BeeTrack.py'
)


if __name__ == '__main__':
    print("🚀 Starting the build process...")
    generate_version_file()
    result = os.system(command)

    if result == 0:
        print("\n✅ Build successful! Check the 'dist' folder.")
    else:
        print("\n❌ Build failed. Check the error messages above.")