import io
import os

import smbclient
import requests
import smbprotocol

# WINDOWS_SERVER_PATH = os.getenv("WINDOWS_SERVER_PATH", "D:\\\\rfm_templates")
# WINDOWS_SERVER_USERNAME = os.getenv("WINDOWS_SERVER_USERNAME", "")
# WINDOWS_SERVER_PASSWORD = os.getenv("WINDOWS_SERVER_PASSWORD", "")

# def save_to_windows_server(contents: bytes, filename: str, server_path: str | None = None) -> str:
#     """Save file contents to a configured Windows server path.

#     Args:
#         contents: Raw bytes of the file to store.
#         filename: Name of the file on the server.
#         server_path: Optional override for the server path. Uses
#             ``WINDOWS_SERVER_PATH`` when omitted.

#     Returns:
#         The full path of the saved file.
#     """
#     path = server_path or WINDOWS_SERVER_PATH
#     os.makedirs(path, exist_ok=True)
#     destination = os.path.join(path, filename)
#     with open(destination, "wb") as dest:
#         dest.write(contents)
#     return destination



WINDOWS_SERVER_PATH = os.getenv("WINDOWS_SERVER_PATH", "C:\\rfm_Uploads")
# WINDOWS_SERVER_HOST = os.getenv("WINDOWS_SERVER_HOST", "")
# WINDOWS_SERVER_SHARE = os.getenv("WINDOWS_SERVER_SHARE", "")
# WINDOWS_SERVER_USERNAME = os.getenv("WINDOWS_SERVER_USERNAME", "")
# WINDOWS_SERVER_PASSWORD = os.getenv("WINDOWS_SERVER_PASSWORD", "")
WINDOWS_SERVER_HOST="108.181.186.101"
WINDOWS_SERVER_SHARE="rfm_Uploads"
WINDOWS_SERVER_USERNAME="administrator"
WINDOWS_SERVER_PASSWORD="KartharEnJeevanAanar@231982%"

WINDOWS_SERVER_PORT="59162"

# def save_to_windows_server(contents: bytes, filename: str, server_path: str | None = None) -> str:
def save_to_windows_server(contents: bytes, filename: str) -> str:
    """Save file contents to Windows server (local or remote)."""

    if WINDOWS_SERVER_HOST:  # Remote mode
        smbclient.ClientConfig(username=WINDOWS_SERVER_USERNAME, password=WINDOWS_SERVER_PASSWORD)
        remote_path = rf"\\{WINDOWS_SERVER_HOST}\{WINDOWS_SERVER_SHARE}\{filename}"
        with smbclient.open_file(remote_path, mode="wb") as dest:
            dest.write(contents)
        print("Successful!!-------------------------   ",remote_path)
        return remote_path

    else:  # Local mode
        path =  WINDOWS_SERVER_PATH
        os.makedirs(path, exist_ok=True)
        destination = os.path.join(path, filename)
        with open(destination, "wb") as dest:
            dest.write(contents)
        print("Upload Successful!!-------------------------   ",destination)
        return destination
    
def upload_image_to_api(api_url, api_key, contents,filename):
    headers = {"Authorization": f"Bearer {api_key}"}
    files = {
        "file": (filename, io.BytesIO(contents), "image/jpeg")
    }
    # with open(files, "rb") as f:
    #     files = {"file": (files, f, "image/png")}
    resp = requests.post(api_url, headers=headers, files=files)
    return resp.json()

def upload_video_to_api(api_url, api_key, contents,filename):
    headers = {"Authorization": f"Bearer {api_key}"}
    files = {
        "file": (filename, io.BytesIO(contents), "video/mp4")
    }
    # with open(files, "rb") as f:
    #     files = {"file": (files, f, "image/png")}
    resp = requests.post(api_url, headers=headers, files=files)
    return resp.json()