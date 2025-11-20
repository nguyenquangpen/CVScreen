from django.conf import settings as st
from django.contrib import admin
from django.urls import include, path

from apps.detailed_profile.view.api import AllMatchResultsView
from apps.detailed_profile.view.web import detailed_profile_view
from apps.overview.view.api import ProcessWithAI, GenerateJdWithAI
from apps.overview.view.web import jd_editor, overview
from apps.resume.view.web import resume_screen

urlpatterns = [
    path("resume/", resume_screen, name="resume_screen"),
    path("overview/", overview, name="overview"),
    path("jd-editor/", jd_editor, name="jd_editor_new"),
    path("jd-editor/<int:jd_id>/", jd_editor, name="jd_editor_edit"),
    path("detailed-profile/", detailed_profile_view, name="detailed_profile"),
    path(
        "detailed-profile/<int:result_id>/",
        detailed_profile_view,
        name="detailed_profile_with_id",
    ),
]

urlpatterns += [
    path("api/process-with-ai/", ProcessWithAI.as_view(), name="process-with-ai"),
    path("api/generate-jd-from-llm/", GenerateJdWithAI.as_view(), name="generate-jd-from-llm"),
    path(
        "api/all-match-results/",
        AllMatchResultsView.as_view(),
        name="all-match-results",
    ),
]

urlpatterns += [
    path("api/", include("config.api_router")),
]

if st.DJANGO_ADMIN:
    urlpatterns += [path("admin/", admin.site.urls)]
