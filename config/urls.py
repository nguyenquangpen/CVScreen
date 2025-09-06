from django.contrib import admin
from django.urls import include, path

from apps.overview.view.web import overview
from apps.resume.view.web import resume_screen

urlpatterns = [
    path("resume/", resume_screen, name="resume_screen"),
    path("overview/", overview, name="overview"),
]

urlpatterns += [
    path("admin/", admin.site.urls),
]
