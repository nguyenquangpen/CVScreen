import os

from django.db import models

# Create your models here.


class Resume(models.Model):
    file_content = models.BinaryField()
    filename = models.TextField()
    mime_type = models.TextField()
    upload_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename


class JobDescription(models.Model):
    file_content = models.BinaryField(blank=True, null=True)
    filename = models.CharField(max_length=255, blank=True, null=True, default="")
    mime_type = models.CharField(max_length=100, blank=True, null=True, default="")
    upload_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename
