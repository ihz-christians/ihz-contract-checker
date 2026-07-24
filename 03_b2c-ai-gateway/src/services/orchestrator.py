import logging
import httpx
import os
import json

from src.services.parser import DocumentParser
from src.services.llm import LlmExtractionService
from src.services.storage import S3StorageService

logger = logging.getLogger(__name__)

class DocumentAnalysisOrchestrator:
    
    @staticmethod
    def _send_progress(task_id: str, callback_url: str, tenant_id: str, progress: int):
        payload = {
            "taskId": task_id,
            "status": "IN_PROGRESS",
            "progress": progress,
            "tenantId": tenant_id
        }
        try:
            with httpx.Client(timeout=5.0) as client:
                client.post(callback_url, json=payload)
        except Exception as e:
            logger.warning(f"Could not send progress update to Java: {e}")
        
    @staticmethod
    def run_pipeline(task_id: str, s3_url: str, callback_url: str, tenant_id: str, compare_s3_url: str | None = None):
        """
        Die Haupt-Pipeline, die asynchron vom FastAPI BackgroundTask aufgerufen wird.
        """
        logger.info(f"Starting pipeline for task {task_id}")
        file_path = None
        compare_file_path = None
        
        try:
            # 1. Echter S3 Download via MinIO
            DocumentAnalysisOrchestrator._send_progress(task_id, callback_url, tenant_id, 10)
            storage_service = S3StorageService()
            file_path = storage_service.download_file(s3_url)
            
            if compare_s3_url:
                compare_file_path = storage_service.download_file(compare_s3_url)
                
            DocumentAnalysisOrchestrator._send_progress(task_id, callback_url, tenant_id, 25)

            # 2. Text extrahieren via PyMuPDF (fitz)
            parser = DocumentParser()
            text = parser.extract_layout_text(file_path)
            
            compare_text = None
            if compare_file_path:
                compare_text = parser.extract_layout_text(compare_file_path)
            
            # Falls das PDF komplett leer oder gescannt (ohne OCR) ist
            if not text or len(text.strip()) < 10:
                text = "Dokument enthält keinen maschinenlesbaren Text. Es handelt sich möglicherweise um einen reinen Bild-Scan ohne OCR."
                logger.warning(f"No text extracted from PDF for task {task_id}")

            DocumentAnalysisOrchestrator._send_progress(task_id, callback_url, tenant_id, 50)

            # 3. LLM Extraktion (Wandelt Text in den "Norm-Vertrag" um)
            llm_service = LlmExtractionService()
            extracted_data_pydantic = llm_service.extract_contract_data(text, compare_text=compare_text)
            
            DocumentAnalysisOrchestrator._send_progress(task_id, callback_url, tenant_id, 75)
            
            # 4. Pydantic Model zu einem reinen dict (JSON-ready) umwandeln
            result_json = extracted_data_pydantic.model_dump()
            
            # WICHTIG: Wir hängen den rohen, ausgelesenen Text an das JSON an,
            # damit Java ihn im Dashboard anzeigen kann!
            result_json["_raw_extracted_text"] = text
            
            logger.info(f"Successfully extracted data for task {task_id}. Sending Webhook to Java...")
            
            # 5. Webhook an Java senden
            webhook_payload = {
                "taskId": task_id,
                "status": "COMPLETED",
                "tenantId": tenant_id,
                "extractedData": result_json
            }
            
            with httpx.Client(timeout=30.0) as client:
                response = client.post(callback_url, json=webhook_payload)
                response.raise_for_status()
                
            logger.info(f"Pipeline finished successfully for task {task_id}. Webhook sent.")
            
        except Exception as e:
            logger.error(f"Pipeline failed for task {task_id}: {str(e)}")
            
            # Im Fehlerfall auch Java informieren, damit das UI nicht auf ewig auf "Pending" hängt!
            error_payload = {
                "taskId": task_id,
                "status": "FAILED",
                "tenantId": tenant_id,
                "errorMessage": str(e)
            }
            try:
                with httpx.Client(timeout=10.0) as client:
                    client.post(callback_url, json=error_payload)
            except Exception as webhook_err:
                logger.error(f"Failed to send FAILED webhook for task {task_id}: {str(webhook_err)}")
                
        finally:
            # Sauberkeit: Die heruntergeladene PDF-Datei vom Docker-Container löschen (Keine Dateileichen)
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
            if compare_file_path and os.path.exists(compare_file_path):
                os.remove(compare_file_path)
                logger.info(f"Cleaned up temporary file: {compare_file_path}")
