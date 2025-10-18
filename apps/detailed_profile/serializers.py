from rest_framework import serializers

from apps.overview.models import MatchResult


class MatchResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchResult
        fields = [
            "id",
            "resume_filename",
            "match_score",
            "candidate_info",
            "candidate_skills",
        ]
