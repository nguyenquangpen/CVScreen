import os

from django.db import models

# Create your models here.


class Resume(models.Model):
    file_content = models.BinaryField()
    filename = models.TextField()
    mime_type = models.TextField()
    content = models.BinaryField()
    upload_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename


class JobDescription(models.Model):
    file_content = models.BinaryField()
    filename = models.TextField()
    mime_type = models.TextField()
    content = models.BinaryField()
    upload_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename
