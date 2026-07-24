import os
import boto3
import tempfile
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class S3StorageService:
    """
    Service zum Herunterladen von Dateien aus S3-kompatiblen Object Storages (AWS, MinIO, etc.).
    """
    def __init__(self):
        # boto3 liest AWS_ACCESS_KEY_ID und AWS_SECRET_ACCESS_KEY automatisch aus der .env
        # Für lokales MinIO müssen wir explizit die Endpoint-URL mitgeben.
        endpoint_url = os.environ.get("AWS_ENDPOINT_URL")
        
        self.s3_client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            region_name=os.environ.get("AWS_DEFAULT_REGION", "eu-central-1")
        )

    def download_file(self, s3_url: str) -> str:
        """
        Lädt eine Datei über eine s3:// URI in eine lokale, temporäre Datei herunter.
        Gibt den Pfad zur lokalen Datei zurück.
        """
        if not s3_url.startswith("s3://"):
            raise ValueError(f"Invalid S3 URL format: {s3_url}")
        
        parsed = urlparse(s3_url)
        bucket = parsed.netloc
        key = parsed.path.lstrip('/')
        
        if not bucket or not key:
            raise ValueError("Bucket or key missing in S3 URL")

        # Sichere, temporäre Datei für das PDF anlegen (OS verwaltet das Verzeichnis)
        fd, temp_path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd) # File Descriptor schließen, damit boto3 darauf zugreifen kann
        
        try:
            logger.info(f"Downloading s3://{bucket}/{key} to {temp_path}...")
            self.s3_client.download_file(bucket, key, temp_path)
            return temp_path
            
        except Exception as e:
            # Wenn der Download fehlschlägt, hinterlassen wir keine Dateileichen
            logger.error(f"Failed to download {s3_url}: {str(e)}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise RuntimeError(f"S3 Download Error: {str(e)}")
