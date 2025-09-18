import logging

from django.conf import settings
from rest_framework import mixins, parsers, status, viewsets
from rest_framework.decorators import action, api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.overview.models import JobDescription, Resume
from apps.overview.serializers import (JobDescriptionSerializer,
                                       ResumeSerializer)

logger = logging.getLogger(__name__)


def _read_file_bytes(drf_file):
    out = bytearray()
    for chunk in drf_file.chunks():
        out.extend(chunk)
        if len(out) > settings.MAX_BYTES:
            raise ValueError("File too large")
    return bytes(out)


class _baseUpLoadView(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
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
            content="",
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


class JobDescriptionViewSet(_baseUpLoadView):
    queryset = JobDescription.objects.all().order_by("-upload_time")
    serializer_class = JobDescriptionSerializer
    model_cls = JobDescription


def CalculateScore(resume):
    # Implement your scoring logic here
    return score
