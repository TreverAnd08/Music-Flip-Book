# 🎵 Music Flip Folder (Prototype)

Offline, director-controlled digital flip folder concept using Web Bluetooth.

## What it does

- Director:
  - Chooses role "Director"
  - Uploads sheet music pages (images)
  - Clicks on a page to make it the "current" one

- Students:
  - Choose role "Student"
  - Connect to the director over Bluetooth (conceptual Web Bluetooth flow)
  - See the current page on their phone

## Important notes

- This is a **prototype**. Real offline Bluetooth broadcasting from a browser is limited today.
- Web Bluetooth:
  - Requires HTTPS or `localhost`
  - Works best on Chrome/Android
  - Does **not** yet fully support acting as a true BLE peripheral/host in most browsers