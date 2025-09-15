# cầu nối giữa model và view

from rest_framework import serializers

from .models import JobDescription, Resume


class ResumeSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = ["id", "filename", "mime_type", "upload_time", "download_url"]
        read_only_fields = ("upload_time",)

    def get_download_url(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(f"/api/resumes/{obj.id}/download/")
        return None


class JobDescriptionSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = JobDescription
        fields = ["id", "filename", "upload_time", "download_url"]
        read_only_fields = ("upload_time",)

    def get_download_url(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(
                f"/api/jobdescriptions/{obj.id}/download/"
            )
        return None
