import mimetypes

from django.conf import settings
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from rest_framework import mixins, parsers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.overview.models import JobDescription, Resume
from apps.overview.serializers import (JobDescriptionSerializer,
                                       ResumeSerializer)


def overview(request):
    return render(
        request,
        "pages/overview_screen.html",
        {
            "TINYMCE_KEY": settings.TINYMCE_KEY,
        },
    )


def jd_editor(request):
    content = request.session.get("jd_content", "")
    return render(
        request,
        "pages/jd_editor.html",
        {
            "content": content,
            "TINYMCE_KEY": settings.TINYMCE_KEY,
        },
    )


def _read_file_bytes(drf_file):
    out = bytearray()
    for chunk in drf_file.chunks():
        out.extend(chunk)
        if len(out) > settings.MAX_BYTES:
            raise ValueError("File too large")
    return bytes(out)


class _baseUpLoadView(
    mixins.CreateModelMixin,  # POST /articles/
    mixins.ListModelMixin,  # GET /articles/
    mixins.RetrieveModelMixin,  # GET /articles/{id}/
    mixins.DestroyModelMixin,  # DELETE /articles/{id}/
    viewsets.GenericViewSet,  # base
):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    model_cls = None

    def create(self, request, *args, **kwargs):
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
            data = _read_file_bytes(file_obj)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        row = self.model_cls.objects.create(
            filename=file_obj.name, mime_type=mime, content=data
        )

        ser = self.get_serializer(row, context={"request": request})
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        obj = get_object_or_404(self.model_cls, pk=pk)
        content_type = (
            obj.mime_type
            or mimetypes.guess_type(obj.filename)[0]
            or "application/octet-stream"
        )
        response = HttpResponse(obj.content, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{obj.filename}"'
        return response


class ResumeViewSet(_baseUpLoadView):
    queryset = Resume.objects.all().order_by("-upload_time")
    serializer_class = ResumeSerializer
    model_cls = Resume


class JobDescriptionViewSet(_baseUpLoadView):
    queryset = JobDescription.objects.all().order_by("-upload_time")
    serializer_class = JobDescriptionSerializer
    model_cls = JobDescription
