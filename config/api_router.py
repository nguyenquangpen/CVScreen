from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.overview.view.api import JobDescriptionViewSet, ResumeViewSet
from apps.resume.view.api import ResumeView

router = DefaultRouter()
router.register(r"resumes", ResumeViewSet, basename="resume")
router.register(r"jobdescriptions", JobDescriptionViewSet, basename="jobdescription")
router.register(r"resumes-new", ResumeView, basename="resume-new")

urlpatterns = [
    path("api/", include(router.urls)),
]
