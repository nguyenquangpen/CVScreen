from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.overview.view.api import JobDescriptionViewSet, ResumeViewSet

router = DefaultRouter()
router.register(r"resumes", ResumeViewSet, basename="resume")
router.register(r"jobdescriptions", JobDescriptionViewSet, basename="jobdescription")

urlpatterns = [
    path("api/", include(router.urls)),
]
