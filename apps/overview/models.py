# File: apps/overview/models.py

from django.db import models

class MatchSession(models.Model):
    job_description_id = models.IntegerField(help_text="ID của JD từ AI server")
    job_description_filename = models.CharField(max_length=255, help_text="Tên file của JD")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Thời gian thực hiện")

    class Meta:
        ordering = ['-created_at'] 

    def __str__(self):
        return f"Kết quả khớp cho '{self.job_description_filename}' lúc {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class MatchResult(models.Model):
    session = models.ForeignKey(MatchSession, related_name='results', on_delete=models.CASCADE)
    resume_id = models.IntegerField(help_text="ID của CV từ AI server")
    job_id = models.IntegerField(help_text="ID của JD từ AI server") 
    resume_filename = models.CharField(max_length=255)
    match_score = models.FloatField()
    candidate_info = models.JSONField(null=True, blank=True)
    candidate_skills = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.resume_filename} - {self.match_score}%"