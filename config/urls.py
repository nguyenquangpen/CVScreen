from django.contrib import admin
from django.urls import include, path

from apps.overview.view.web import overview
from apps.resume.view.web import resume_screen
from apps.detailed_profile.view.web import detailed_profile_view

urlpatterns = [
    path("resume/", resume_screen, name="resume_screen"),
    path("overview/", overview, name="overview"),
    path("detailed-profile/", detailed_profile_view, name="detailed_profile"),
]

urlpatterns += [
    path("admin/", admin.site.urls),
]
