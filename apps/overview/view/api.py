import logging

from django.conf import settings
from rest_framework import mixins, parsers, status, viewsets
from rest_framework.decorators import action, api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.overview.models import JobDescription, Resume
from apps.overview.serializers import (JobDescriptionSerializer,
                                       ResumeSerializer)
from rest_framework.views import APIView
import requests
import io
import docx
from PyPDF2 import PdfReader
from datetime import datetime

logger = logging.getLogger(__name__)


def _read_file_bytes(drf_file):
    out = bytearray()
    for chunk in drf_file.chunks():
        out.extend(chunk)
        if len(out) > settings.MAX_BYTES:
            raise ValueError("File too large")
    return bytes(out)

def _extract_text_from_bytes(file_bytes, mime_type):
    if isinstance(file_bytes, memoryview):
        file_bytes = bytes(file_bytes)

    extracted_text = ""
    try:
        if "application/pdf" in mime_type and PdfReader:
            reader = PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                extracted_text += page.extract_text() or ""
        elif "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in mime_type and docx:
            document = docx.Document(io.BytesIO(file_bytes))
            for paragraph in document.paragraphs:
                extracted_text += paragraph.text + "\n"
        elif "text/plain" in mime_type:
            extracted_text = file_bytes.decode('utf-8', errors='ignore')
        else:
            logger.info(f"No specific text extractor for mime type: {mime_type}. Content will be empty.")
        
    except Exception as e:
        logger.error(f"Error extracting text from {mime_type}: {e}", exc_info=True)
        extracted_text = ""
    return extracted_text

class _baseUpLoadView(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]
    model_cls = None

    @action(detail=False, methods=["post"], url_path="upload")
    def upload_file(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        mime = file_obj.content_type or "application/octet-stream"
        if mime not in settings.ALLOWED_MIMES:
            return Response(
                {"error": "Unsupported file type"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            raw_file_data = _read_file_bytes(file_obj)

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"Error during text extraction/preprocessing: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        row = self.model_cls.objects.create(
            filename=file_obj.name,
            mime_type=mime,
            file_content=raw_file_data,
        )

        logger.info(f"Uploaded file: {file_obj.name}, size: {len(raw_file_data)} bytes")

        ser = self.get_serializer(row, context={"request": request})
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path="delete")
    def delete_item(self, request, pk=None):
        return self.destroy(request, pk=pk)


class ResumeViewSet(_baseUpLoadView):
    queryset = Resume.objects.all().order_by("-upload_time")
    serializer_class = ResumeSerializer
    model_cls = Resume


class JobDescriptionViewSet(_baseUpLoadView, mixins.UpdateModelMixin, mixins.CreateModelMixin):
    queryset = JobDescription.objects.all().order_by("-upload_time")
    serializer_class = JobDescriptionSerializer
    model_cls = JobDescription

    def create(self, request, *args, **kwargs):
        logger.debug(f"[JobDescriptionViewSet-create] Initial request data: {request.data}")
        mutable_data = request.data.copy()

        if 'content' in mutable_data and mutable_data['content'] is not None:
            if not mutable_data.get('mime_type'):
                mutable_data['mime_type'] = 'text/plain'
                logger.debug(f"[JobDescriptionViewSet-create] Assigned default mime_type: {mutable_data['mime_type']}")
            if not mutable_data.get('filename'):
                timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                mutable_data['filename'] = f"New_JD_from_Editor_{timestamp}.txt"
                logger.debug(f"[JobDescriptionViewSet-create] Assigned default filename: {mutable_data['filename']}")
        else:
            logger.debug(f"[JobDescriptionViewSet-create] 'content' not found or is None. Not applying default filename/mime_type logic.")

        logger.debug(f"[JobDescriptionViewSet-create] Data sent to serializer: {mutable_data}")
        serializer = self.get_serializer(data=mutable_data)
        
        if not serializer.is_valid():
            logger.error("[JobDescriptionViewSet-create] Serializer validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        instance = serializer.save() 
        instance.refresh_from_db() 

        logger.debug(f"[JobDescriptionViewSet-create] Saved JobDescription instance ID: {instance.id}")
        logger.debug(f"[JobDescriptionViewSet-create] Saved instance file_content type: {type(instance.file_content)}")
        
        if instance.file_content:
            file_content_as_bytes = bytes(instance.file_content)
            logger.debug(f"[JobDescriptionViewSet-create] Saved instance file_content (first 100 bytes): {file_content_as_bytes[:100]}")
            try:
                logger.debug(f"[JobDescriptionViewSet-create] Saved instance file_content (decoded preview): {file_content_as_bytes.decode('utf-8', errors='ignore')[:100]}")
            except Exception as e:
                logger.debug(f"[JobDescriptionViewSet-create] Could not decode file_content for preview: {e}")
        else:
            logger.debug(f"[JobDescriptionViewSet-create] Saved instance file_content is empty or None.")

        logger.info(f"[JobDescriptionViewSet-create] JobDescription created successfully. Filename: {instance.filename}, Mime_type: {instance.mime_type}")
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

class ProcessWithAI(APIView):
    def post(self, request):
        resume_ids = request.data.get("resume_ids")
        job_ids = request.data.get("job_ids")

        if not resume_ids or not job_ids:
            return Response(
                {"error": "resume_ids and job_ids are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ai_payload = {
            "resume_ids": resume_ids,
            "job_ids": job_ids,
        }

        try:
            ai_server_base_url = settings.AI_URL
            ai_endpoint = f"{ai_server_base_url}/process-with-ai/"

            response_from_ai = requests.post(
                ai_endpoint,
                json=ai_payload,
            )
            response_from_ai.raise_for_status()
            ai_response_data = response_from_ai.json()
            return Response(ai_response_data, status=status.HTTP_200_OK)

        except requests.exceptions.Timeout:
            logger.error(f"Timeout communicating with AI server at {ai_endpoint}")
            return Response(
                {"error": "AI service did not respond in time."},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except requests.RequestException as e:
            logger.error(f"Error communicating with AI server: {e}")
            return Response(
                {"error": f"Failed to communicate with AI server: {e}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as e:
            logger.exception("Unexpected error in ProcessWithAI Django view.")
            return Response(
                {"error": "An unexpected server error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )