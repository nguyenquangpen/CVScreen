from django.db import models


class MatchSession(models.Model):
    job_description_id = models.IntegerField()
    job_description_filename = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Match for JD '{self.job_description_filename}' at {self.created_at}"


class MatchResult(models.Model):
    session = models.ForeignKey(
        MatchSession, related_name="results", on_delete=models.CASCADE
    )
    resume_id = models.IntegerField()  # Lưu ID của CV từ server AI
    resume_filename = models.CharField(max_length=255)
    match_score = models.FloatField()
    candidate_info = models.JSONField(null=True, blank=True)
    candidate_skills = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.resume_filename} - {self.match_score}%"
