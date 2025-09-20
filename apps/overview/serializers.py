# cầu nối giữa model và view

from rest_framework import serializers

from .models import JobDescription, Resume


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id",
            "filename",
            "mime_type",
            "upload_time",
        ]
        read_only_fields = ("upload_time",)


class JobDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobDescription
        fields = [
            "id",
            "filename",
            "upload_time",
        ]
        read_only_fields = ("upload_time",)
