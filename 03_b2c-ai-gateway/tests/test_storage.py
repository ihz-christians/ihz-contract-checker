import pytest
import os
from unittest.mock import patch, MagicMock
from src.services.storage import S3StorageService

@patch("src.services.storage.boto3.client")
def test_download_file_success(mock_boto3_client):
    # ARRANGE: Wir mocken die AWS S3 Antwort
    mock_s3 = MagicMock()
    mock_boto3_client.return_value = mock_s3
    
    service = S3StorageService()
    s3_url = "s3://b2c-contracts/tenant-123/contract.pdf"
    
    # ACT: Datei herunterladen
    local_path = service.download_file(s3_url)
    
    # ASSERT: boto3 muss exakt mit Bucket "b2c-contracts" und Key "tenant-123/contract.pdf" aufgerufen werden
    mock_boto3_client.assert_called_once()
    mock_s3.download_file.assert_called_once_with("b2c-contracts", "tenant-123/contract.pdf", local_path)
    
    # Der Service muss einen validen lokalen Temp-Pfad zurückgeben
    assert os.path.exists(local_path)
    assert local_path.endswith(".pdf")
    
    # Cleanup (da boto3 gemockt ist, ist die Datei leer, aber sie wurde von tempfile erstellt)
    os.remove(local_path)

def test_invalid_s3_url_format():
    service = S3StorageService()
    
    # Wenn Java uns eine falsche URL schickt, muss es knallen
    with pytest.raises(ValueError, match="Invalid S3 URL format"):
        service.download_file("http://localhost:9000/b2c-contracts/file.pdf")

def test_missing_bucket_or_key():
    service = S3StorageService()
    
    with pytest.raises(ValueError, match="Bucket or key missing"):
        service.download_file("s3://b2c-contracts/") # Key fehlt
