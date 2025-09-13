from django.db import models
import os
# Create your models here.
class ProcessedCv(models.Model):
    cv_file = models.FileField(upload_to='cv_uploads/')
    email = models.EmailField(max_length=254, blank=True, null=True)
    upload_time = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default="Uploaded")
    
    def __str__(self):
        return self.cv_file.name
    
    @property
    def filename(self):
        return os.path.basename(self.cv_file.name)

