from django.contrib import admin
from django.urls import include, path

from apps.detailed_profile.view.web import detailed_profile_view
from apps.overview.view.web import jd_editor, overview
from apps.resume.view.web import resume_screen

# from apps.overview.view.api import ProcessSelectionWithAIView

urlpatterns = [
    path("resume/", resume_screen, name="resume_screen"),
    path("overview/", overview, name="overview"),
    path("editor_jd/", jd_editor, name="jd_editor"),
    path("detailed-profile/", detailed_profile_view, name="detailed_profile"),
]

urlpatterns += [
    # path("api/process-with-ai/", ProcessSelectionWithAIView.as_view(), name="process-with-ai"),
]

urlpatterns += [
    path("", include("config.api_router")),
]

urlpatterns += [
    path("admin/", admin.site.urls),
]
